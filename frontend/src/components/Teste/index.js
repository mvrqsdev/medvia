import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import "./../../output.css";

const useStyles = makeStyles(theme => ({
  fixedDiv: {
    position: "fixed",
    top: "0",
    right: "0",
    width: "20rem",
    backgroundColor: "red",
    minHeight: "100vh",
    color: "white",
    zIndex: 1500

  },
  subClass: {
    position: "relative",
    top: "-5px",
    backgroundColor: "white",
    width: "100%",
    height: "9.4rem",
    color: "black",
    margin: ".4rem",
  },

  rainbowGradient: {
    width: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(to right, orange , yellow, green, cyan, blue, violet)",
  }
}));

  const Teste = () => {
	
    const classes = useStyles();


	return (
    <div className={classes.fixedDiv}>
      <div className={classes.rainbowGradient}>
        <div className={classes.subClass}>teste</div>
      </div>
    </div>
	);
};

export default Teste;