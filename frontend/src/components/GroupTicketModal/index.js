import React, { useState, useEffect, useRef, useContext } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useHistory } from "react-router-dom";

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
import Chip from "@material-ui/core/Chip";
import InputAdornment from "@material-ui/core/InputAdornment";
import { Can } from "../../components/Can";
import TableRowSkeleton from "../../components/TableRowSkeleton";

import { Switch, FormControlLabel,Select,MenuItem, InputLabel, FormControl } from "@material-ui/core";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
	},
	textField: {
		marginRight: theme.spacing(1),
		flex: 1,
	},
	formControl: {
		minWidth: 120,
		width: "100%"
	},

	extraAttr: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},

	btnWrapper: {
		position: "relative",
	},

	buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
}));






const GroupTicketModal = ({ open, onClose,ticket, ticketName}) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const history = useHistory();
	const [contacts, setContacts] = useState();
	



	const handleClose = () => {
		onClose();
	};

	useEffect(() => {

		const fetchGroup = async () => {
			try{
				if(!ticket) return;
	
				const response = await api.get("/group/"+ticket.id);
				if(response){
					const fetchParticipants = async () => {
						const data = await api.post("/group/members",response);
						setContacts(data.data);
					};
					fetchParticipants();
				}
			} catch (err){
				toastError(err);
			}
		};
		fetchGroup();
	},[open])

	const handleNewChat = async (contactId) => {
        try {
			if(!contactId) return;

            const { data: ticket } = await api.post("/tickets", {
                contactId: contactId,
                userId: user.id,
                status: "open",
            });
            history.push(`/tickets/${ticket.uuid}`);
        } catch (err) {
            toastError(err);
        }
    }



	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="xl" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{`${i18n.t("groupMembersModal.title")}`}
				</DialogTitle>
				<DialogContent dividers>
					{contacts &&
					
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell></TableCell>
									<TableCell>{i18n.t("contacts.table.name")}</TableCell>
									<TableCell align="center">
										{i18n.t("contacts.table.whatsapp")}
									</TableCell>
									<TableCell align="center">
										{i18n.t("contacts.table.actions")}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
							{contacts.map((contact) => (
					<TableRow key={contact.id}>
					<TableCell style={{ paddingRight: 0 }}>
						{<Avatar src={contact.profilePicUrl} />}
					</TableCell>
					<TableCell>{contact.name}</TableCell>
					<TableCell align="center">{contact.number}</TableCell>
					<TableCell align="center">
						<IconButton
						size="small"
						onClick={() => {
							handleNewChat(contact.id);
							handleClose();
						}}
						>
						<WhatsAppIcon />
						</IconButton>
					</TableCell>
					</TableRow>
				))}
						</TableBody>
					</Table>
					}
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleClose}
						color="secondary"
						variant="outlined"
					>
						Fechar
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default GroupTicketModal;
