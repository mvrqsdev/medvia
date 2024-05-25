import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

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

import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";

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
}));



const ContactSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(120, "Too Long!")
		.required("Required"),
	number: Yup.string().min(8, "Too Short!").max(50, "Too Long!"),
	email: Yup.string().email("Invalid email"),
	category: Yup.string().required()
});

const ContactModal = ({ open, onClose, contactId, initialValues, onSave}) => {
	const classes = useStyles();
	const isMounted = useRef(true);

	const initialState = {
		name: "",
		number: "",
		email: "",
		origem: "",
		origensId: "",
		receivePendency: false,
		receiveCritical: false,
		receiveReview: false,
		category: "other",
		specialty: "",
		extraInfo: []
	};


	const [contact, setContact] = useState(initialState);
	const [origens, setOrigens] = useState([]);


	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(()=>{
		const fetchOrigens = async () => {
			try{
				const {data} = await api.get("/origens/all");
				setOrigens(data);
			} catch (err){
				toastError(err);
			}
		};
		fetchOrigens();
	},[]);

	useEffect(() => {
		const fetchContact = async () => {
			if (initialValues) {
				setContact(prevState => {
					return { ...prevState, ...initialValues };
				});
			}

			if (!contactId) return;

			try {
				const { data } = await api.get(`/contacts/${contactId}`);
				if (isMounted.current) {
					setContact(data);
				}
			} catch (err) {
				toastError(err);
			}
		};

		fetchContact();
	}, [contactId, open, initialValues]);

	const handleClose = () => {
		onClose();
		setContact(initialState);
	};

	const handleSaveContact = async values => {
		try {
			if (contactId) {

				let dados = {...contact, extraInfo: values.extraInfo};
				
				if(dados.category === "customer"){
					dados.specialty = "";
				}

				if(dados.category === "medic"){
					dados.origensId = null;
					dados.receiveCritical = false;
					dados.receivePendency = false;
					dados.receiveReview = false;
				}
				
				if(dados.category === "other"){
					dados.specialty = "";
					dados.origensId = null;
					dados.receiveCritical = false;
					dados.receivePendency = false;
					dados.receiveReview = false;
				}

				await api.put(`/contacts/${contactId}`, dados);
				onSave();
				handleClose();
			} else {

				let dados = {...contact, extraInfo: values.extraInfo};
				
				if(dados.category === "customer"){
					dados.specialty = "";
				}

				if(dados.category === "medic"){
					dados.origensId = null;
					dados.receiveCritical = false;
					dados.receivePendency = false;
					dados.receiveReview = false;
				}
				
				if(dados.category === "other"){
					dados.specialty = "";
					dados.origensId = null;
					dados.receiveCritical = false;
					dados.receivePendency = false;
					dados.receiveReview = false;
				}

				// setContact((prev) => ({...prev, extraInfo: values.extraInfo}));
				const { data } = await api.post("/contacts", dados);
				if (onSave) {
					onSave();
				}
				handleClose();
			}
			toast.success(i18n.t("contactModal.success"));
		} catch (err) {
			toastError(err);
		}
	};

	const handleOnChangeOrigen = (value) => {
		// console.log(value);
		if(value === null){
			setContact(prev => ({ ...prev, origensId: null }));
		}else{
			setContact(prev => ({ ...prev, origensId: value.id }));
		}
	}


	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="xl" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{contactId
						? `${i18n.t("contactModal.title.edit")}`
						: `${i18n.t("contactModal.title.add")}`}
				</DialogTitle>
				<Formik
					initialValues={contact}
					enableReinitialize={true}
					validationSchema={ContactSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveContact(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ values, errors, touched, isSubmitting }) => (
						<Form style={{width: "600px"}}>
							<DialogContent dividers>
								<Typography variant="subtitle1" gutterBottom>
									{i18n.t("contactModal.form.mainInfo")}
								</Typography>
								
								<div>
									<Field
										as={TextField}
										label={i18n.t("contactModal.form.name")}
										name="name"
										fullWidth
										autoFocus
										value={contact.name}
										onChange={(e) => setContact(prev => ({ ...prev, name: e.target.value }))}
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										margin="dense"
										disabled={contact.isGroup}
										className={classes.textField}
									/>
								</div>
								<div>
									<Field
										as={TextField}
										label={i18n.t("contactModal.form.number")}
										name="number"
										value={contact.number}
										onChange={(e) => setContact(prev => ({ ...prev, number: e.target.value }))}
										fullWidth
										error={touched.number && Boolean(errors.number)}
										helperText={touched.number && errors.number}
										placeholder="5513912344321"
										variant="outlined"
										margin="dense"
										disabled={contact.isGroup}
									/>
								</div>
								
								<div>
									<Field
										as={TextField}
										label={i18n.t("contactModal.form.email")}
										name="email"
										value={contact.email}
										onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
										error={touched.email && Boolean(errors.email)}
										helperText={touched.email && errors.email}
										placeholder="Endereço de E-mail"
										fullWidth
										margin="dense"
										variant="outlined"
										disabled={contact.isGroup}
									/>
								</div>
								
								<FormControl
										variant="outlined"
										className={classes.formControl}
										margin="dense"
									>

									<InputLabel id="profile-selection-input-label">
										{i18n.t("contactModal.form.category")}
									</InputLabel>

									<Field
										as={Select}
										label={i18n.t("contactModal.form.category")}
										name="category"
										labelId="category-selection-label"
										id="category-selection"
										value={contact.category}
										onChange={(e,newValue) => setContact(prev => ({ ...prev, category: e.target.value }))}
									>
										<MenuItem value="medic">Médico</MenuItem>
										<MenuItem value="customer">Cliente</MenuItem>
										<MenuItem value="other">Outro</MenuItem>
									</Field>
								</FormControl>
								{ contact.category === "medic" &&
								<FormControl
										variant="outlined"
										className={classes.formControl}
										margin="dense"
									>

									<InputLabel id="specialty-selection-input-label">
										{i18n.t("contactModal.form.specialty")}
									</InputLabel>

									<Field
										as={Select}
										label={i18n.t("contactModal.form.specialty")}
										name="specialty"
										labelId="specialty-selection-label"
										id="specialty-selection"
										value={contact.specialty}
										onChange={(e) => setContact(prev => ({ ...prev, specialty: e.target.value }))}
									>
										<MenuItem value="Corpo">Corpo</MenuItem>
										<MenuItem value="Neuro">Neuro</MenuItem>
										<MenuItem value="Raio X">Raio X</MenuItem>
										<MenuItem value="Músculo Esquelético">Músculo Esquelético</MenuItem>
										<MenuItem value="Densitometria">Densitometria</MenuItem>
										<MenuItem value="Mamografia">Mamografia</MenuItem>
										<MenuItem value="Geral">Geral</MenuItem>
										<MenuItem value="Cardio">Cardio</MenuItem>
										<MenuItem value="Mama">Mama</MenuItem>
									</Field>
								</FormControl>
								}

								{ contact.category === "customer" &&
								<div>
									<FormControl
											variant="outlined"
											className={classes.formControl}
											margin="dense"
										>
										<Autocomplete
											fullWidth
											options={origens}
											clearOnBlur
											autoHighlight
											freeSolo
											clearOnEscape
											onChange={(e,value) => handleOnChangeOrigen(value)}
											defaultValue={origens.find(origen => origen.id === contact.origensId)}
											getOptionLabel={(option) => option.name}
											renderInput={params => (
												<TextField {...params} label="Origem" variant="outlined" />
											)}
										/>
									</FormControl>
								</div>
								}
								<div>
								{contact.category === "customer" &&
									<Grid spacing={2} container>
										<Grid xs={12} md={12} item>
											<FormControlLabel
												control={
												<Field
													as={Switch}
													color="primary"
													name="isDefault"
													onClick={(e) => setContact(prev => ({ ...prev, receivePendency: !contact.receivePendency }))}
													checked={contact.receivePendency}
												/>
												}
												label="Pendências"
											/>
											<FormControlLabel
												control={
												<Field
													as={Switch}
													color="primary"
													name="isDefault"
													onClick={(e) => setContact(prev => ({ ...prev, receiveReview: !contact.receiveReview }))}
													checked={contact.receiveReview}
												/>
												}
												label="Revisões"
											/>
											<FormControlLabel
												control={
												<Field
													as={Switch}
													color="primary"
													name="isDefault"
													onClick={(e) => setContact(prev => ({ ...prev, receiveCritical: !contact.receiveCritical }))}
													checked={contact.receiveCritical}
												/>
												}
												label="Achados Críticos"
											/>

										</Grid>
									</Grid>
								}
								</div>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.extraInfo")}
								</Typography>

								<FieldArray name="extraInfo">
									{({ push, remove }) => (
										<>
											{values.extraInfo &&
												values.extraInfo.length > 0 &&
												values.extraInfo.map((info, index) => (
													<div
														className={classes.extraAttr}
														key={`${index}-info`}
													>
														<Field
															as={TextField}
															label={i18n.t("contactModal.form.extraName")}
															name={`extraInfo[${index}].name`}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
														<Field
															as={TextField}
															label={i18n.t("contactModal.form.extraValue")}
															name={`extraInfo[${index}].value`}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
														<IconButton
															size="small"
															onClick={() => remove(index)}
														>
															<DeleteOutlineIcon />
														</IconButton>
													</div>
												))}
											<div className={classes.extraAttr}>
												<Button
													style={{ flex: 1, marginTop: 8 }}
													variant="outlined"
													color="primary"
													onClick={() => push({ name: "", value: "" })}
												>
													{`+ ${i18n.t("contactModal.buttons.addExtraInfo")}`}
												</Button>
											</div>
										</>
									)}
								</FieldArray>

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
									{contactId
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

export default ContactModal;
