import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import Chip from "@material-ui/core/Chip";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import OrigenModal from "../../components/OrigenModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { socketConnection } from "../../services/socket";

import {CSVLink} from "react-csv";

const reducer = (state, action) => {
  if (action.type === "LOAD_ORIGENS") {
    const origens = action.payload;
    const newOrigens = [];

    origens.forEach((origen) => {
      const origenIndex = state.findIndex((o) => o.id === origen.id);
      if (origenIndex !== -1) {
        state[origenIndex] = origen;
      } else {
        newOrigens.push(origen);
      }
    });

    return [...state, ...newOrigens];
  }

  if (action.type === "UPDATE_ORIGENS") {
    const origen = action.payload;
    const origenIndex = state.findIndex((o) => o.id === origen.id);

    if (origenIndex !== -1) {
      state[origenIndex] = origen;
      return [...state];
    } else {
      return [origen, ...state];
    }
  }

  if (action.type === "DELETE_ORIGEN") {
    const origenId = action.payload;

    const origenIndex = state.findIndex((o) => o.id === origenId);
    if (origenIndex !== -1) {
      state.splice(origenIndex, 1);
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
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  }
}));

const Origens = () => {
  const classes = useStyles();
  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [origens, dispatch] = useReducer(reducer, []);
  const [hasMore, setHasMore] = useState(false);
  const [deletingOrigen, setDeletingOrigen] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);


  const [selectedOrigenId, setSelectedOrigenId] = useState(null);


  const [origenModalOpen, setOrigenModalOpen] = useState(false);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchOrigens = async () => {
        try {
          const { data } = await api.get("/origens/", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_ORIGENS", payload: data.origens });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchOrigens();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-origen`, (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_ORIGENS", payload: data.origen });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_ORIGEN", payload: +data.origenId });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
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


  const hadleEditOrigen = (contactId) => {
    setSelectedOrigenId(contactId);
    setOrigenModalOpen(true);
  };

  const handleOpenOrigenModal = () => {
    setSelectedOrigenId(null);
    setOrigenModalOpen(true);
  };

  const handleCloseOrigenModal = () => {
    setSelectedOrigenId(null);
    setOrigenModalOpen(false);
  };


  const handleDeleteOrigen = async () => {
    if(!deletingOrigen) return;

    try {
      await api.delete(`/origens/${deletingOrigen.id}`);
      toast.success(`${deletingOrigen.name} deletado com sucesso.`);
    } catch (err) {
      toastError(err);
    }
    setDeletingOrigen(null);
    setSearchParam("");
    setPageNumber(1);
  };



  return (
    <MainContainer className={classes.mainContainer}>
      <ConfirmationModal
        title="Deletar Origem ?"
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={handleDeleteOrigen}
      >
        Deseja deletar a Origem {deletingOrigen ? deletingOrigen.name : ""}
      </ConfirmationModal>
      <OrigenModal
      open={origenModalOpen}
      onClose={handleCloseOrigenModal}
      aria-labelledby="form-dialog-title"
      origenId={selectedOrigenId}
      />
      <MainHeader>
        <Title>Origens</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenOrigenModal}
          >
            ADICIONAR ORIGENS
          </Button>

         {/* <CSVLink style={{ textDecoration:'none'}} separator=";" filename={'contatos.csv'} data={contacts.map((contact) => ({ name: contact.name, number: contact.number, email: contact.email }))}>
          <Button	variant="contained" color="primary"> 
          EXPORTAR CONTATOS 
          </Button>
          </CSVLink> */}

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
              <TableCell>{i18n.t("contacts.table.name")}</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Observação</TableCell>
              <TableCell align="center">
                {i18n.t("contacts.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {origens.map((origen) => (
                <TableRow key={origen.id}>
                  <TableCell>{origen.name}</TableCell>
                  <TableCell>{origen.type}</TableCell>
                  <TableCell>{origen.priority}</TableCell>
                  <TableCell>{origen.observation}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      
                    >
                      <EditIcon
                        onClick={() => hadleEditOrigen(origen.id)}
                      />
                    </IconButton>
                    <Can
                      role={user.profile}
                      perform="contacts-page:deleteContact"
                      yes={() => (
                        <IconButton
                          size="small"
                          
                        >
                          <DeleteOutlineIcon
                            onClick={(e) => {
                              setConfirmOpen(true);
                              setDeletingOrigen(origen)
                            }}
                          />
                        </IconButton>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton avatar columns={3} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Origens;
