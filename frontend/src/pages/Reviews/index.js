import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import ListAltIcon from '@material-ui/icons/ListAlt';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Avatar from "@material-ui/core/Avatar";
import Tooltip from "@material-ui/core/Tooltip";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import Chip from "@material-ui/core/Chip";
import { Field } from "formik";
import { FormControlLabel, Switch } from "@material-ui/core";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal/";

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
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import ReviewFormModal from "../../components/ReviewFormModal";

import {CSVLink} from "react-csv";

const categoria = {
  "customer"  : "Cliente",
  "medic"     : "Médico",
  "other"     : "Outros"
};

const specialty = {
  "corpo"         : "Corpo",
  "neuro"         : "Neuro",
  "musc"          : "Músculo",
  "raiox"         : "Raio X",
  "densitometria" : "Densitometria",
  "mamografia"    : "Mamografia",
  "geral"         : "Geral",
  "cardio"        : "Cardio",
  "mama"          : "Mama",
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    marginTop: "0px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },

  isGroup: {
    backgroundColor: "f8f9fa",
    borderTopRightRadius: "10px",
    borderTopLeftRadius: "10px"
  },

  category: {
    backgroundColor: "f8f9fa",
  },
  boxTab: {
    boxShadow: "0px 2px 7px 0px rgba(100, 100, 111, 0.4)",
    borderTopRightRadius: "10px",
    borderTopLeftRadius: "10px",
    margin: "10px 10px 0px 10px",
    display: "flex",
    justifyContent: "space-between",
    paddingLeft: "15px",
    paddingRight: "15px"
  }
}));

const Reviews = () => {
  const classes = useStyles();
  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [exams, setExams] = useState([])
  const [openFormReview, setOpenFormReview] = useState(false);
  const [situation, setSituation] = useState("Pendente");
  const [updated,setUpdated] = useState(true);
  const [selectedReview , setSelectedReview] = useState();


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {


      const fetchExams = async () => {
        try {
          const { data } = await api.get("/exams/", {
            params: { searchParam,situation },
          });

          setLoading(false);
          setExams(data.exams);
          console.log(data.exams);

        } catch (err) {
          toastError(err);
        }
      };
      fetchExams();
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [situation,searchParam,updated]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-review`, (data) => {

      setExams((prevExams) => {
        // Atualiza os contatos com base na ação recebida do socket
        if (data.action === "update" || data.action === "create") {
          const updatedExams = prevExams.map((exam) =>
            exam.id === data.exam.id ? data.exam : exam
          );
          // Adiciona um novo contato se ele não existir na lista
          if (!updatedExams.find((exam) => exam.id === data.exam.id)) {
            updatedExams.push(data.exam);
          }
          return updatedExams;
        } else if (data.action === "delete") {
          // Remove o contato da lista
          return prevExams.filter((exam) => exam.id !== +data.exam.id);
        }
        return prevExams;
      });

    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = (event) => {
    setLoading(true);
    setExams([]);
    setSearchParam(event.target.value.toLowerCase());
  };




  const handleChangeOpenReviewFormModal = () => {
    setOpenFormReview(false);
  }

  const handleChangeSituation = (valor) => {
    setLoading(true);
    setExams([]);
    setSituation(valor);
  }


  const handleOnSave = () => {
    setUpdated(!updated);
  }


  return (
    <MainContainer className={classes.mainContainer}>
      <ReviewFormModal
      open={openFormReview}
      onClose={handleChangeOpenReviewFormModal}
      exam={selectedReview}
      />
      
      <MainHeader>
        <Title>Revisões</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder="Busque o ID ou Nome"
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

        </MainHeaderButtonsWrapper>
      </MainHeader>
      <div className={classes.boxTab}>
          <Tabs onChange={(e, newValue) => handleChangeSituation(newValue)} value={situation} className={classes.category} variant="fullWidth">
            <Tab label="Pendente" value="Pendente" />
            <Tab label="Em Andamento" value="Em Andamento" />
            <Tab label="Resolvido"  value="Resolvido" />           
          </Tabs>
          
          
        </div>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
      >
        
        
        <Table size="small">

          {situation === "Pendente" &&
            <>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell align="center">
                    Exame
                  </TableCell>
                  <TableCell align="center">
                    Data do Exame
                  </TableCell>
                  <TableCell align="center">
                    Origem
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("contacts.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
 
                      <TableCell>{exam.patientId}</TableCell>
                      <TableCell>{exam.name}</TableCell>
                      <TableCell>{exam.description}</TableCell>
                      <TableCell>{exam.dateExam}</TableCell>
                      <TableCell align="center">{exam.origen.name}</TableCell>
                      <TableCell align="center">
                      <Tooltip title="Ver Formulário">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setOpenFormReview(true);
                            setSelectedReview(exam);
                          }}
                        >
                          <ListAltIcon />
                        </IconButton>
                      </Tooltip>
                        <Tooltip title="Enviar mensagem no WhatsApp">
                          <IconButton
                            size="small"
                            
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton avatar columns={3} />}
                </>
              </TableBody>
            </>
          }
          {situation === "Em Andamento" &&
            <>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell align="center">
                    Exame
                  </TableCell>
                  <TableCell align="center">
                    Data do Exame
                  </TableCell>
                  <TableCell align="center">
                    Revisor
                  </TableCell>
                  <TableCell align="center">
                    Origem
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("contacts.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
 
                      <TableCell>{exam.patientId}</TableCell>
                      <TableCell>{exam.name}</TableCell>
                      <TableCell>{exam.description}</TableCell>
                      <TableCell>{exam.dateExam}</TableCell>
                      <TableCell>{exam.contact.name}</TableCell>
                      <TableCell align="center">{exam.origen.name}</TableCell>
                      <TableCell align="center">
                      <Tooltip title="Ver Formulário">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setOpenFormReview(true);
                            setSelectedReview(exam);
                          }}
                        >
                          <ListAltIcon />
                        </IconButton>
                      </Tooltip>
                        <Tooltip title="Enviar mensagem no WhatsApp">
                          <IconButton
                            size="small"
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Finalizar revisão">
                          <IconButton
                            size="small"
                          >
                            <CheckCircleIcon color="primary"/>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton avatar columns={3} />}
                </>
              </TableBody>
            </>
          }
          
          
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Reviews;
