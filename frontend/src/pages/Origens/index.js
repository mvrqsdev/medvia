import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  useContext,
} from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import OrigemModal from "../../components/OrigemModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { Chip } from "@material-ui/core";
import { socketConnection } from "../../services/socket";
import { AuthContext } from "../../context/Auth/AuthContext";

const reducer = (state, action) => {
  if (action.type === "LOAD_ORIGEMS") {
    const origens = action.payload;
    const newOrigens = [];

    origens.forEach((origem) => {
      const origemIndex = state.findIndex((s) => s.id === origem.id);
      if (origemIndex !== -1) {
        state[origemIndex] = origem;
      } else {
        newOrigens.push(origem);
      }
    });

    return [...state, ...newOrigens];
  }

  if (action.type === "UPDATE_ORIGEMS") {
    const origem = action.payload;
    const origemIndex = state.findIndex((s) => s.id === origem.id);

    if (origemIndex !== -1) {
      state[origemIndex] = origem;
      return [...state];
    } else {
      return [origem, ...state];
    }
  }

  if (action.type === "DELETE_ORIGEM") {
    const origemId = action.payload;

    const origemIndex = state.findIndex((s) => s.id === origemId);
    if (origemIndex !== -1) {
      state.splice(origemIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const Origens = () => {
  const classes = useStyles();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedOrigem, setSelectedOrigem] = useState(null);
  const [deletingOrigem, setDeletingOrigem] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [origens, dispatch] = useReducer(reducer, []);
  const [origemModalOpen, setorigemModalOpen] = useState(false);

  const fetchOrigems = useCallback(async () => {
    try {
      const { data } = await api.get("/origem/", {
        params: { searchParam, pageNumber },
      });
      console.log(data)
      dispatch({ type: "LOAD_ORIGEMS", payload: data.origens });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  }, [searchParam, pageNumber]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchOrigems();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, fetchOrigems]);

  useEffect(() => {
    const socket = socketConnection({ companyId: user.companyId });

    socket.on("user", (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_ORIGEMS", payload: data.origens });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_USER", payload: +data.origemId });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleOpenOrigemModal = () => {
    setSelectedOrigem(null);
    setorigemModalOpen(true);
  };

  const handleCloseOrigemModal = () => {
    setSelectedOrigem(null);
    setorigemModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditOrigem = (origem) => {
    setSelectedOrigem(origem);
    setorigemModalOpen(true);
  };

  const handleDeleteOrigem = async (origemId) => {
    try {
      await api.delete(`/origem/${origemId}`);
      toast.success(i18n.t("origem.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingOrigem(null);
    setSearchParam("");
    setPageNumber(1);

    dispatch({ type: "RESET" });
    setPageNumber(1);
    await fetchOrigems();
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={deletingOrigem && "Excluir Origem ?"}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteOrigem(deletingOrigem.id)}
      >
         Você esta excluindo esta origem
      </ConfirmationModal>
      <OrigemModal
        open={origemModalOpen}
        onClose={handleCloseOrigemModal}
        reload={fetchOrigems}
        aria-labelledby="form-dialog-title"
        origemId={selectedOrigem && selectedOrigem.id}
      />
      <MainHeader>
        <Title>Médicos</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenOrigemModal}
          >
            Novo Médico
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Nome do Médico</TableCell>
              <TableCell align="center">
                CRM/UF
              </TableCell>
              <TableCell align="center">
                Disponíbilidade
              </TableCell>
              <TableCell align="center">
                {i18n.t("origem.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {origens.map((origem) => (
                <TableRow key={origem.id}>
                  <TableCell align="center">
                    {origem.name}
                  </TableCell>
                  <TableCell align="center">{origem.isWhatsApp ? "Externo" : "Interno"}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEditOrigem(origem)}>
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingOrigem(origem);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={3} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Origens;
