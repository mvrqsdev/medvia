import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";


import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import { FiberManualRecord } from "@material-ui/icons";
import {Grid, Switch, FormControlLabel,Select,MenuItem, InputLabel, FormControl } from "@material-ui/core";

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
	red: {
		color: "#b80025",
	},
	yellow: {
		color: "#d9b100",
	},
	green: {
		color: "#038705"
	}
}));



const OrigenSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(120, "Too Long!")
		.required("Required"),
	type: Yup.string().required(),
	priority: Yup.string().required(),
	frequency: Yup.string().required(),
	interval: Yup.string().min(8,"Precisa ser preenchido completamente.").required(),
});

const OrigenModal = ({ open, onClose, origenId, initialValues, onSave}) => {
	const classes = useStyles();
	const isMounted = useRef(true);

	const initialState = {
		name: "",
		type: "",
		groupTeams: "",
		priority: "",
		observation: "",
		frequency: 1,
		interval: "00:30:00",
	};


	const [groupsOrigens, setGroupsOrigens] = useState([]);
	const [origen, setOrigen] = useState(initialState);
	const startWorkRef = useRef();


	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(() => {
		const fetchGroupsTeams = async () => {
			try{
				const {data} = await api.get("/origens/teams");
				setGroupsOrigens(data.value);
				console.log(data.value);

			} catch (err){
				toastError(err);
			}
		};
		fetchGroupsTeams();
	},[]);


	useEffect(() => {
		const fetchOrigen = async () => {
			if (initialValues) {
				setOrigen(prevState => {
					return { ...prevState, ...initialValues };
				});
			}

			if (!origenId) return;

			try {
				const { data } = await api.get(`/origens/${origenId}`);
				if (isMounted.current) {
					setOrigen(data);
				}
			} catch (err) {
				toastError(err);
			}
		};

		fetchOrigen();
	}, [origenId, open, initialValues]);

	const handleClose = () => {
		onClose();
		setOrigen(initialState);
	};

	const handleSelectedOption = (newValue) => {
		console.log(newValue);

		if(!newValue){
			setOrigen(prev => ({ ...prev, groupTeams: "" }));
		}else{
			setOrigen(prev => ({ ...prev, groupTeams: newValue.id }));
		}
		console.log(origen)
	}

	const handleSelectedType = (newValue) => {
		setOrigen(prev => ({ ...prev, type: newValue}));
		if(newValue === "Externa"){
			setOrigen(prev => ({...prev, groupTeams: ""}));
		}
	}

	const handleSelectedInterval = (newValue) => {
		if(newValue === "00:00:00" || newValue === "00:00:01" || newValue === "00:00:02" || newValue === "00:00:03" || newValue === "00:00:04") return;
		setOrigen(prev => ({ ...prev, interval: newValue }));
	}


	// FORMULARIO ESTA PRONTO, FALTA FAZER A HANDLE SUBMIT


	const handleSaveContact = async values => {
		try {
				if(!origenId){
					const { data } = await api.post("/origens", origen);
					if (onSave) {
						onSave(data);
					}
					handleClose();
				}else{
					const { data } = await api.put("/origens/"+origenId, origen);
					if (onSave) {
						onSave(data);
					}
					handleClose();

				}
			
			toast.success(i18n.t("contactModal.success"));
		} catch (err) {
			toastError(err);
		}
	};




	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="xl" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{origenId
						? `Editar Origem`
						: `Adicionar Origem`}
				</DialogTitle>
				<Formik
					initialValues={origen}
					enableReinitialize={true}
					validationSchema={OrigenSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveContact(values);
							actions.setSubmitting(false);
						}, 400);
					}}
					
				>
					{({ values, errors, touched, isSubmitting }) => (
						<Form style={{width: "500px"}}>
							<DialogContent dividers>
								<Typography variant="subtitle1" gutterBottom>
									Dados da Origem
								</Typography>
								
								<div>
									<Field
										as={TextField}
										label="Nome da Origem"
										name="name"
										fullWidth
										autoFocus
										value={origen.name}
										onChange={(e) => setOrigen(prev => ({ ...prev, name: e.target.value }))}
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										margin="dense"
										className={classes.textField}
									/>
								</div>
								<div>
								<FormControl
										variant="outlined"
										className={classes.formControl}
										margin="dense"
									>

									<InputLabel id="profile-selection-input-label">
										Tipo de Origem
									</InputLabel>

									<Field
										as={Select}
										label="Tipo de Origem"
										name="type"
										labelId="type-selection-label"
										id="type-selection"
										value={origen.type}
										onChange={(e) => handleSelectedType(e.target.value)}
										required
									>
										<MenuItem value="Interna">Interna</MenuItem>
										<MenuItem value="Externa">Externa</MenuItem>
									</Field>
								</FormControl>
								</div>

								{origen.type === "Interna" && groupsOrigens &&
									<div>
										<FormControl
											variant="outlined"
											className={classes.formControl}
											margin="dense"
										>
										<Autocomplete
											fullWidth
											options={groupsOrigens}
											clearOnBlur
											autoHighlight
											freeSolo
											clearOnEscape
											defaultValue={groupsOrigens.find(group => group.id === origen.groupTeams)}
											getOptionLabel={(option) => option.topic}
											onChange={(e,newValue) => handleSelectedOption(newValue)}
											renderInput={params => (
												<TextField {...params} label="Grupo no Teams" variant="outlined" />
											)}
										/>
									</FormControl>
										
									</div>
								}
								
								<div>
								<FormControl
										variant="outlined"
										className={classes.formControl}
										margin="dense"
									>

									<InputLabel id="profile-selection-input-label">
										Prioridade
									</InputLabel>

									<Field
										as={Select}
										label="Prioridade"
										name="priority"
										labelId="priority-selection-label"
										id="priority-selection"
										value={origen.priority}
										onChange={(e) => setOrigen(prev => ({ ...prev, priority: e.target.value }))}
										required
									>
										<MenuItem value="🟢 Baixa"><FiberManualRecord className={classes.green}/> Baixa</MenuItem>
										<MenuItem value="🟡 Média"><FiberManualRecord className={classes.yellow}/> Média</MenuItem>
										<MenuItem value="🔴 Alta"><FiberManualRecord className={classes.red}/> Alta</MenuItem>
									</Field>
								</FormControl>
								</div>
								<div>
									<Field
										as={TextField}
										label="Observação"
										type="observation"
										multiline
										rows={4}
										fullWidth
										name="observation"
										value={origen.observation}
										onChange={(e) => setOrigen(prev => ({ ...prev, observation: e.target.value }))}
										variant="outlined"
										margin="dense"
									/>
								</div>
								<div>
									<Typography variant="subtitle2" color="secondary" gutterBottom>
										Envio de Achados Críticos
									</Typography>
									<Grid spacing={2} container>
										<Grid xs={6} md={6} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>

												<InputLabel id="profile-selection-input-label">
													N° de Envios
												</InputLabel>

												<Field
													as={Select}
													label="N° de Envios"
													name="frequency"
													labelId="frequency-selection-label"
													id="frequency-selection"
													value={origen.frequency}
													onChange={(e) => setOrigen(prev => ({ ...prev, frequency: e.target.value }))}
													required
												>
													<MenuItem value={1}>1</MenuItem>
													<MenuItem value={2}>2</MenuItem>
													<MenuItem value={3}>3</MenuItem>
													<MenuItem value={4}>4</MenuItem>
												</Field>
											</FormControl>

										</Grid>

										{origen.frequency > 1 && <Grid xs={6} md={6} item>
											<Field
												as={TextField}
												label="Intervalo entre eles"
												type="time"
												ampm={false}
												defaultValue={origen.interval}
												inputRef={startWorkRef}
												InputLabelProps={{
													shrink: true,
												}}
												onChange={(e) => handleSelectedInterval(e.target.value)}
												inputProps={{
													step: 1, // 1 min
												  }}
												fullWidth
												name="startWork"
												variant="outlined"
												margin="dense"
												className={classes.textField}
											/>
										</Grid>}
									</Grid>
								</div>

								
								
								

								{/* { contact.category === "customer" &&
								<div>
									<Field
										as={TextField}
										label={i18n.t("contactModal.form.origem")}
										name="origem"
										error={touched.origem && Boolean(errors.origem)}
										helperText={touched.origem && errors.origem}
										placeholder="Origem do PACS"
										fullWidth
										margin="dense"
										variant="outlined"
									/>
								</div>
								} */}


							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("contactModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{origenId
										? `${i18n.t("contactModal.buttons.okEdit")}`
										: `${i18n.t("contactModal.buttons.okAdd")}`}
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

export default OrigenModal;
