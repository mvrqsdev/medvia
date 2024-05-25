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

const Contacts = () => {
  const classes = useStyles();
  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, setContacts] = useState([])
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [category, setCategory] = useState("medic");
  const [isGroup, setIsGroup] = useState(false);
  const [updated,setUpdated] = useState(true);


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {


      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/contacts/", {
            params: { searchParam,category, isGroup },
          });

          setLoading(false);
          setContacts(data.contacts);

        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [isGroup,category,searchParam,updated]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-contact`, (data) => {

      setContacts((prevContacts) => {
        // Atualiza os contatos com base na ação recebida do socket
        if (data.action === "update" || data.action === "create") {
          const updatedContacts = prevContacts.map((contact) =>
            contact.id === data.contact.id ? data.contact : contact
          );
          // Adiciona um novo contato se ele não existir na lista
          if (!updatedContacts.find((contact) => contact.id === data.contact.id)) {
            updatedContacts.push(data.contact);
          }
          return updatedContacts;
        } else if (data.action === "delete") {
          // Remove o contato da lista
          return prevContacts.filter((contact) => contact.id !== +data.contact.id);
        }
        return prevContacts;
      });

    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = (event) => {
    setLoading(true);
    setContacts([]);
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  // const handleSaveTicket = async contactId => {
  // 	if (!contactId) return;
  // 	setLoading(true);
  // 	try {
  // 		const { data: ticket } = await api.post("/tickets", {
  // 			contactId: contactId,
  // 			userId: user?.id,
  // 			status: "open",
  // 		});
  // 		history.push(`/tickets/${ticket.id}`);
  // 	} catch (err) {
  // 		toastError(err);
  // 	}
  // 	setLoading(false);
  // };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const hadleEditContact = (contactId) => {
    setSelectedContactId(contactId);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      toast.success(i18n.t("contacts.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingContact(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const handleimportContact = async () => {
    try {
      await api.post("/contacts/import");
      history.go(0);
    } catch (err) {
      toastError(err);
    }
  };


  const handleChangeCategory = (valor) => {
    setLoading(true);
    setContacts([]);
    setCategory(valor);
  }

  const handleChangeIsGroup = () => {
    setLoading(true);
    setContacts([]);
    setIsGroup(!isGroup);
  }
  const handleOnSave = () => {
    setUpdated(!updated);
  }


  return (
    <MainContainer className={classes.mainContainer}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <ContactModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        onSave={handleOnSave}
        aria-labelledby="form-dialog-title"
        contactId={selectedContactId}
      ></ContactModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${
                deletingContact.name
              }?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={(e) =>
          deletingContact
            ? handleDeleteContact(deletingContact.id)
            : handleimportContact()
        }
      >
        {deletingContact
          ? `${i18n.t("contacts.confirmationModal.deleteMessage")}`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <MainHeader>
        <Title>Clientes</Title>
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
            onClick={(e) => setConfirmOpen(true)}
          >
            {i18n.t("contacts.buttons.import")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenContactModal}
          >
            {i18n.t("contacts.buttons.add")}
          </Button>

         <CSVLink style={{ textDecoration:'none'}} separator=";" filename={'contatos.csv'} data={contacts.map((contact) => ({ name: contact.name, number: contact.number, email: contact.email }))}>
          <Button	variant="contained" color="primary"> 
          EXPORTAR CONTATOS 
          </Button>
          </CSVLink>

        </MainHeaderButtonsWrapper>
      </MainHeader>
      <div className={classes.boxTab}>
          <Tabs onChange={(e, newValue) => handleChangeCategory(newValue)} value={category} className={classes.category} variant="fullWidth">
            <Tab label="Médicos" value="medic" />
            <Tab label="Clientes" value="customer" />
            <Tab label="Outros"  value="other" />           
          </Tabs>
          <FormControlLabel
              control={
                <Switch
                onClick={handleChangeIsGroup}
                checked={isGroup}
                name="checkedA"
                inputProps={{ 'aria-label': 'secondary checkbox' }}
              />
              }
              label="Grupos"
            />
          
        </div>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
      >
        
        
        <Table size="small">
          {category === "medic" &&
            <>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell align="center">
                    Especialidade
                  </TableCell>
                  <TableCell align="center">
                    WhatsApp
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("contacts.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell style={{ paddingRight: 0 }}>
                        {<Avatar src={contact.profilePicUrl} />}
                      </TableCell>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell align="center">{contact.specialty}</TableCell>
                      <TableCell align="center">{contact.number}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setContactTicket(contact);
                            setNewTicketModalOpen(true);
                          }}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => hadleEditContact(contact.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <Can
                          role={user.profile}
                          perform="contacts-page:deleteContact"
                          yes={() => (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setConfirmOpen(true);
                                setDeletingContact(contact);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton avatar columns={3} />}
                </>
              </TableBody>
            </>
          }
          
          {category === "customer" &&
            <>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell align="center">
                    Origem
                  </TableCell>
                  <TableCell align="center">
                    Prioridade
                  </TableCell>
                  <TableCell align="center">
                    Número
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("contacts.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell style={{ paddingRight: 0 }}>
                        {<Avatar src={contact.profilePicUrl} />}
                      </TableCell>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell align="center">{contact.origen?.name}</TableCell>
                      <TableCell align="center">{contact.origen?.priority}</TableCell>
                      <TableCell align="center">{contact.number}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setContactTicket(contact);
                            setNewTicketModalOpen(true);
                          }}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => hadleEditContact(contact.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <Can
                          role={user.profile}
                          perform="contacts-page:deleteContact"
                          yes={() => (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setConfirmOpen(true);
                                setDeletingContact(contact);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton avatar columns={3} />}
                </>
              </TableBody>
            </>
          }

          {category === "other" &&
            <>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell align="center">
                    Número
                  </TableCell>
                  <TableCell align="center">
                    Email
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("contacts.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell style={{ paddingRight: 0 }}>
                        {<Avatar src={contact.profilePicUrl} />}
                      </TableCell>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell align="center">{contact.number}</TableCell>
                      <TableCell align="center">{contact.email}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setContactTicket(contact);
                            setNewTicketModalOpen(true);
                          }}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => hadleEditContact(contact.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <Can
                          role={user.profile}
                          perform="contacts-page:deleteContact"
                          yes={() => (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setConfirmOpen(true);
                                setDeletingContact(contact);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          )}
                        />
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

export default Contacts;
