import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";


import Autocomplete, {
	createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import Chip from '@material-ui/core/Chip';

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
	pendente: {
		backgroundColor: "#c90000",
		color: "white"
	},
	emAndamento: {
		backgroundColor: "#e0b400",
		color: "black"
	},
	resolvido: {
		backgroundColor: "#00ad06",
		color: "white"
	}
}));



const ReviewFormModal = ({ open, onClose, exam}) => {
	const classes = useStyles();
	const [selectedExam , setSelectedExam] = useState();

	const situation = {
		"Pendente" : "pendente",
		"Em Andamento" : "emAndamento",
		"Resolvido" : "resolvido"
	}


	useEffect(() => {
		if(!exam) return;
		setSelectedExam(exam);
	})


	const handleClose = () => {
		onClose();
	};






	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="xl" scroll="paper">
				<DialogTitle id="form-dialog-title">
					Formulário de Revisão <Chip size="small"
					label={selectedExam ? selectedExam.situation : ""}
					className={selectedExam ? classes[situation[selectedExam.situation]] : classes.pendente}
					/>
				</DialogTitle>
				<Formik
					enableReinitialize={true}
					
				>
						<Form style={{width: "40vw"}}>
							<DialogContent dividers>
								
								<div>
									
									<Typography variant="subtitle2" gutterBottom>
										Dados do Exame
									</Typography>
									<Grid spacing={2} container>
										<Grid xs={3} md={3} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="ID"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.patientId : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>
										<Grid xs={9} md={9} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Nome do Paciente"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.name : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>

									</Grid>
								</div>
								<div>
									<FormControl
										variant="outlined"
										className={classes.formControl}
										margin="dense"
									>
										<Field
											as={TextField}
											label="Descrição do Exame"
											fullWidth
											autoFocus
											value={selectedExam ? selectedExam.description : ""}
											InputProps={{
												readOnly: true,
											  }}
											variant="outlined"
											margin="dense"
											className={classes.textField}
										/>
									</FormControl>
								</div>
								<div>
								<Grid spacing={2} container>
										<Grid xs={3} md={3} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Data do Exame"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.dateExam : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>
										<Grid xs={3} md={3} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Accession N°"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.accessionNumber : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>
										<Grid xs={6} md={6} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Realizante"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.radiologista : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>

								</Grid>
								
								</div>
								<Grid spacing={2} container>
										<Grid xs={6} md={6} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Origem"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.origen.name : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>
										{selectedExam && selectedExam.contact &&
										
										<Grid xs={6} md={6} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Revisor"
													autoFocus
													fullWidth
													value={selectedExam ? selectedExam.contact.name : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>
										}
										

								</Grid>
								<div>
									
									<Typography variant="subtitle2" gutterBottom>
										Dados da Revisão
									</Typography>
									<Grid spacing={2} container>
										<Grid xs={12} md={12} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Motivo da Revisão"
													autoFocus
													fullWidth
													value={selectedExam ? JSON.parse(selectedExam.dataJson)['Classifique a discordância'] : ""}
													InputProps={{
														readOnly: true,
													  }}
													variant="outlined"
													margin="dense"
													className={classes.textField}
												/>
											</FormControl>

										</Grid>
									</Grid>
								</div>
								<Grid spacing={2} container>
										<Grid xs={12} md={12} item>
											<FormControl
												variant="outlined"
												className={classes.formControl}
												margin="dense"
											>
												<Field
													as={TextField}
													label="Descrição da revisão"
													multiline
													rows={4}
													value={selectedExam ? JSON.parse(selectedExam.dataJson)['Outros motivos de revisão/Comentários adicionais'] : ""}
													InputProps={{
														readOnly: true,
													  }}
													fullWidth
													variant="outlined"
													margin="dense"
												/>
											</FormControl>

										</Grid>
									</Grid>
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
							
						</Form>
				</Formik>
			</Dialog>
		</div>
	);
};

export default ReviewFormModal;
