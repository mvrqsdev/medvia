import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Colorize } from "@material-ui/icons";
import { ColorBox } from 'material-ui-color';

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { FormControlLabel, Switch, FormControl} from '@material-ui/core';
import { AuthContext } from "../../context/Auth/AuthContext";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";

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
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
	},
	colorAdorment: {
		width: 20,
		height: 20,
	},
}));

const OrigemSchema = Yup.object().shape({
	name: Yup.string()
		.min(3, "Mensagem muito curta")
		.required("Obrigatório"),
	idGroup: Yup.string()
		.min(1,"Requer um grupo")
		.required("Obrigatório")
});



const OrigemModal = ({ open, onClose, origemId, reload }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);

	const initialState = {
		name: "",
		isWhatsApp: true,
		idGroup: ""
	};

	const [origem, setOrigem] = useState(initialState);

	useEffect(() => {
		try {
			(async () => {
				if (!origemId) return;

				const { data } = await api.get(`/origem/${origemId}`);
				setOrigem(prevState => {
					return { ...prevState, ...data };
				});
			})()
		} catch (err) {
			toastError(err);
		}
	}, [origemId, open]);

	const handleClose = () => {
		setOrigem(initialState);
		onClose();
	};


	const handleSaveOrigem = async values => {
		const origemData = { ...values, userId: user.id };
		console.log(origemData);
		try {
			if (origemId) {
				await api.put(`/origem/${origemId}`, origemData);
			} else {
				await api.post("/origem", origemData);
			}
			toast.success(i18n.t("tagModal.success"));
			if (typeof reload == 'function') {
				reload();
			}
		} catch (err) {
			toastError(err);
		}
		handleClose();
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{(origemId ? `${i18n.t("origemModal.title.edit")}` : `${i18n.t("origemModal.title.add")}`)}
				</DialogTitle>
				<Formik
					initialValues={origem}
					enableReinitialize={true}
					validationSchema={OrigemSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveOrigem(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting }) => (
						<Form>
							<DialogContent dividers>
								<div className={classes.multFieldLine}>
									
								<FormControl variant="outlined" margin="dense" fullWidth>
								
									<Field
										as={TextField}
										label="Nome do PACS"
										id="name"
										labelId="name"
										name="name"
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										margin="dense"
										onChange={(e) => setOrigem(prev => ({ ...prev, name: e.target.value }))}
										fullWidth
									/>
									</FormControl>
									
								</div>
								<br />
								<div className={classes.multFieldLine}>
								<FormControl variant="outlined" margin="dense" fullWidth>
									<InputLabel id="situacao" fullWidth>
										Tipo de Origem
									</InputLabel>
										<Field
										as={Select}
										fullWidth
										label="Tipo de Origem"
										error={touched.isWhatsApp && Boolean(errors.isWhatsApp)}
										helperText={touched.isWhatsApp && errors.isWhatsApp}
										placeholder={i18n.t("origemModal.form.name")}
										labelId="situacao"
										onChange={(e) => setOrigem(prev => ({ ...prev, isWhatsApp: e.target.value }))}
										name="isWhatsApp"
										>
										<MenuItem value={true}>Externo</MenuItem>
										<MenuItem value={false}>Interno</MenuItem>
										</Field>
									</FormControl>
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<FormControl variant="outlined" margin="dense" fullWidth>
										
									<InputLabel id="idGroup" fullWidth>
										Grupo
									</InputLabel>
										<Field
										as={Select}
										fullWidth
										label="Grupo"
										placeholder={i18n.t("origemModal.form.group")}
										id="idGroup"
										labelId="idGroup"
										onChange={(e) => setOrigem(prev => ({ ...prev, idGroup: e.target.value }))}
										name="idGroup"
										error={touched.idGroup && Boolean(errors.idGroup)}
										helperText={touched.idGroup && errors.idGroup}
										>
										<MenuItem value="id1">Plantão | Canoas - Tomoclinica</MenuItem>
										<MenuItem value="id2">Plantão | Brasilia - Diagnostik</MenuItem>
										</Field>
									</FormControl>
								</div>
								<br />
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("tagModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{origemId
										? `${i18n.t("tagModal.buttons.okEdit")}`
										: `${i18n.t("tagModal.buttons.okAdd")}`}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default OrigemModal;
