import React, { useEffect } from 'react';
import toastError from "../../errors/toastError";
import locationPreview from "../../assets/locationPreview.webp";

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    maxWidth: 345,
	margin: "10px"
  },
});

const LocationPreview = ({ image, link, description }) => {
	const classes = useStyles();
    useEffect(() => {}, [image, link, description]);

    const handleLocation = async() => {
        try {
            window.open(link);
        } catch (err) {
            toastError(err);
        }
    }

    return (
		<Card className={classes.root}>
			<CardActionArea onClick={handleLocation}>
				<CardMedia
				component="img"
				alt="Contemplative Reptile"
				height="140"
				image={locationPreview}
				title="Contemplative Reptile"
				/>
				<CardContent>
				<Typography gutterBottom variant="h6" component="h6">
					Localização
				</Typography>
				<Typography variant="body2" color="textSecondary" component="p">
					Clique aqui para visualizar essa localização.
				</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
		
		
	);

};

export default LocationPreview;