import React, { useEffect, useState, useContext, useRef } from 'react';
import { useHistory } from "react-router-dom";
import toastError from "../../errors/toastError";
import { toast } from 'react-toastify';
import api from "../../services/api";
import defaultIcon from "../../assets/defaultIcon.png";

import Avatar from "@material-ui/core/Avatar";
import Grid from "@material-ui/core/Grid";

import { AuthContext } from "../../context/Auth/AuthContext";

import Divider from '@material-ui/core/Divider';
import { Theme, createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import MessageIcon from '@material-ui/icons/Message';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import SkipNextIcon from '@material-ui/icons/SkipNext';

const useStyles = makeStyles((theme) =>
    createStyles({
      root: {
        display: 'flex',
        margin: "10px",
      },
      details: {
        display: 'flex',
        flexDirection: 'column',
      },
      content: {
        flex: '1 0 auto',
      },
      cover: {
        width: 100,
        height: 100,
        borderRadius: "100%",
        margin: "10px",
      },
      controls: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: theme.spacing(1),
        paddingBottom: theme.spacing(1),
      },
      playIcon: {
        height: 38,
        width: 38,
      },
    }),
  );

const VcardPreview = ({ contacts, ticket }) => {
    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const { user } = useContext(AuthContext);
    const initialState = {
		id: null,
		pictureUrl: "",
		name: "",
		number: "",
		isValid: false,
	};

    const [selectedContacts, setContacts] = useState([initialState]);
    

    useEffect(() => {
        const fetchContacts = async () => {
            try{
                const {data} = await api.post("/contacts/vcard",contacts);
                setContacts(data);
                
            }catch(err){
                toastError(err);
            }
        };

        fetchContacts();
    },[]);


    const handleNewChat = async (id) => {
        try {
            if(!id) return;
            const { data: ticket } = await api.post("/tickets", {
                contactId: id,
                userId: user.id,
                status: "open",
                whatsappId: ticket.whatsappId
            });
            history.push(`/tickets/${ticket.uuid}`);
        } catch (err) {
            toastError(err);
        }
    }

    return (
        selectedContacts.map((contact) =>
            <Card className={classes.root}>
                <div className={classes.details}>
                    <CardContent className={classes.content}>
                    <Typography component="h7" variant="h7">
                        <strong>{contact.name.substring(0,12)}</strong>
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                        {contact.number}`
                    </Typography>
                    </CardContent>
                    <div className={classes.controls}>
                    {(contact.id) &&
                    <IconButton aria-label="previous" onClick={() => handleNewChat(contact.id)}>
                        <MessageIcon
                        
                        />
                    </IconButton>
                    }
                    
                    </div>
                </div>
                <CardMedia
                    className={classes.cover}
                    image={contact.profilePicUrl ? contact.profilePicUrl : defaultIcon}
                    title={`Foto de ${contact.name}`}
                />
            </Card>
        )
    )

};

export default VcardPreview;