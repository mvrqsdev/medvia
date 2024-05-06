import React, { useState, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid"; 
import Box from "@material-ui/core/Box";
import { Field, Formik} from "formik";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import { FormControlLabel, Switch, FormControl, RadioGroup, Radio} from '@material-ui/core';
import InputLabel from "@material-ui/core/InputLabel";

import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";
import logo2 from "../../assets/logo2.png";
import slide2B from "../../assets/slide2B.jpg";


const Copyright = () => {
	return (
		<Typography variant="body2" color="primary" align="center">
			{"Copyright "}
 			<Link color="primary" href="#">
 				PLW
 			</Link>{" "}
 			{new Date().getFullYear()}
 			{"."}
 		</Typography>
 	);
 };

const useStyles = makeStyles(theme => ({
	root: {
		width: "100vw",
		height: "100vh",
		background: "linear-gradient(to right, #91C854 , #7ac22b , #6abd11)",
		backgroundImage: `url(${slide2B})`,
		backgroundRepeat: "no-repeat",
		backgroundSize: "100% 100%",
		backgroundPosition: "center",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		textAlign: "center",
	},
	paper: {
		backgroundColor: theme.palette.login, //DARK MODE PLW DESIGN//
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "55px 30px",
		borderRadius: "12.5px",
	},
	avatar: {
		margin: theme.spacing(1),  
		backgroundColor: theme.palette.secondary.main,
	},
	form: {
		width: "100%", // Fix IE 11 issue.
		marginTop: theme.spacing(1),
	},
	submit: {
		margin: theme.spacing(3, 0, 2),
	},
	powered: {
		color: "white"
	},
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
	},
}));

const Login = () => {
	const classes = useStyles();

	const [user, setUser] = useState({ email: "", password: "" });

	const { handleLogin } = useContext(AuthContext);

	const handleChangeInput = e => {
		setUser({ ...user, [e.target.name]: e.target.value });
	};

	const handlSubmit = e => {
		e.preventDefault();
		handleLogin(user);
	};

	return (
		<div className={classes.root}>
		<Container component="main" maxWidth="md">
			<CssBaseline/>
			<div className={classes.paper}>
				{/*<Typography component="h1" variant="h5">
					{i18n.t("login.title")}
				</Typography>*/}
				<div>
					<img style={{ margin: "0 auto", width: "30%" }} src={logo2} alt="Whats" />
				</div>
				<Formik>
				<form className={classes.form} noValidate onSubmit={handlSubmit}>
				<FormControl component="fieldset">
					<RadioGroup aria-label="gender" name="gender1" style={{display: "flex", flexDirection: "row"}}>
						<FormControlLabel value="female" control={<Radio />} label="Cartão de Crédito" />
						<FormControlLabel value="male" control={<Radio />} label="Pix" />
					</RadioGroup>
					</FormControl>
					<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label="N° Cartão"
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
					/>
					<div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
						<div style={{width: "48%"}}>
						<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label="Validade"
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
					/>
						</div>
						<div style={{width: "48%"}}>
						<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label="CVV"
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
					/>
						</div>
					</div>
					<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label="Nome Impresso no Cartão"
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
					/>
					<div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
						<div style={{width: "48%"}}>
						<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label="CEP"
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
					/>
						</div>
						<div style={{width: "48%"}}>
						<TextField
						variant="outlined"
						margin="normal"
						required
						fullWidth
						id="email"
						label="Número"
						name="email"
						value={user.email}
						onChange={handleChangeInput}
						autoComplete="email"
						autoFocus
					/>
						</div>
					</div>
					<FormControl variant="outlined" margin="dense" fullWidth>
						<InputLabel id="situacao" fullWidth>
							N° Parcelas
						</InputLabel>
						<Field
						as={Select}
						fullWidth
						label="N° Parcelas"
						placeholder="situacao"
						labelId="situacao"
						name="isWhatsApp"
						>
							<MenuItem value={true}>1</MenuItem>
						</Field>
					</FormControl>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						color="primary"
						className={classes.submit}
					>
						FINALIZAR PAGAMENTO
					</Button>
					{/* { <Grid container>
						<Grid item>
							<Link
								href="#"
								variant="body2"
								component={RouterLink}
								to="/signup"
							>
								{i18n.t("login.buttons.register")}
							</Link>
						</Grid>
					</Grid> } */}
				</form>
				</Formik>
			
			</div>
			
			
		</Container>
		</div>
	);
};

export default Login;
