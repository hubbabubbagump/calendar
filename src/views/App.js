import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import SaveIcon from '@material-ui/icons/Save';
import AddIcon from '@material-ui/icons/Add';
import Calendar from './components/Calendar.js';
import DateTimePicker from 'react-datetime-picker';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import dateFns from "date-fns";
import { ScaleLoader } from 'react-spinners';

import './../css/App.css';

class App extends Component {
   constructor() {
      super();

      this.calendar = React.createRef();
      this.email = React.createRef();
      this.password = React.createRef();

      this.sidebarDay = null;

      this.day = "";
      this.events = []

      this.state = {
         loading: true,
         date: new Date(),
         eventTitle: "",
         eventLocation: "",
         showAddDialog: false,
         showLoginDialog: true,
         isRegisterDialog: false,
         rememberme: false,
         missingTitle: false,
         email: "",
         password: "",
         invalidEmail: false,
         invalidPassword: false,
         loggedin: false,
         sidebarDate: "",
         sidebarEvents: []
      }
   }

   componentWillMount() {
      fetch('/api/check_status', {
         method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
         if (data && data.cookie_set) {
            this.getEvents();
            this.setState({ showLoginDialog: false, loggedin: true, rememberme: true });
         }
         this.setState({ loading: false });
      })
      .catch(error => console.error(error));
   }

   handleShowAddDialog = () => {
      this.setState({ showAddDialog: true, eventTitle: "", date: new Date()});
   }

   handleHideAddDialog = () => {
      this.setState({ showAddDialog: false});
   }

   handleShowLoginDialog = () => {
      this.setState({ showLoginDialog: true});
   }

   handleHideLoginDialog = () => {
      this.setState({ showLoginDialog: false });
   }

   onEventTitleChange = event => {
      if (event.target.value) {
         this.setState({ eventTitle: event.target.value, missingTitle: false });
      }
      else {
         this.setState({ eventTitle: event.target.value });
      }
   }

   onEventLocationChange = event => {
      console.log(event.target.value);
      this.setState({ eventLocation: event.target.value});
   }

   onDateChange = date => {
      this.setState({date: date});
   }

   calendarChange = (date, events) => {
      if (!this.sidebarDay 
         || !dateFns.isSameDay(date, this.sidebarDay)
         || JSON.stringify(events) !== JSON.stringify(this.events)) {
         
         const format = "MMM D YYYY";
         this.setState({ sidebarDate: dateFns.format(date, format)});

         this.sidebarDay = date;
         
         if (events) {
            let tempEvents = [];
            for (let i = 0; i < events.length; i++) {
               const timeFormat = "h:mm A";
               let title = events[i].title;
               let day = events[i].time;
               let timeString = dateFns.format(day, timeFormat);
               let location = events[i].location;

               tempEvents.push(
                  <div className="event" key={events[i].time}>
                     {title ? <span className="event-title">{events[i].title}</span> : null}
                     {title ? <br/> : null}
                     <span className="event-time">{timeString}</span>
                     {location ? <br/> : null}
                           {location ? <span className="event-time">{'Where: ' + location}</span> : null}
                  </div>
               )
            }

            this.setState({ sidebarEvents: tempEvents });
         }
         else {
            this.setState({sidebarEvents: []})
         }
      }
   }

   saveEvent = () => {
      const title = this.state.eventTitle;
      const location = this.state.eventLocation;
      const date = this.state.date;

      if (!title) {
         this.setState({missingTitle: true});
         return;
      }

      this.setState({missingTitle: false});

      fetch(`/api/addEvent?title=${title}&date=${date}&location=${location}`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({
            "email": this.state.email,
            "password": this.state.password
         })
      })
      .then(response => response.json())
      .then(data => {
         this.calendar.current.addEvent(data._id, data.title, new Date(data.date), data.location);
         this.handleHideAddDialog()
      })
      .catch(error => console.error(error));
   }

   getEvents = () => {
      fetch('/api/getEvents', {
         method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
         for (let i = 0; i < data.length; i++) {
            this.calendar.current.addEvent(data[i]._id, data[i].title, new Date(data[i].date), data[i].location);
         }
      })
      .catch(error => console.error(error));
   }

   signin = () => {
      console.log("sign in");
      const email = this.state.email;
      const password = this.state.password;
      const rememberme = this.state.rememberme;
      let error = false;

      if (!email || !email.match(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/)) {
         this.setState({invalidEmail: true});
         error = true;
      }
      else {
         this.setState({invalidEmail: false});
      }

      if (!password) {
         this.setState({invalidPassword: true});
         error = true;
      }
      else {
         this.setState({invalidPassword: false});
      }

      if (!error) {
         fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
               "email": email,
               "password": password,
               "setCookie": rememberme
            })
         })
         .then(response => response.json())
         .then(data => {
            if (data && data.isValid) {
               this.setState({ loggedin: true});
               this.getEvents();
               this.handleHideLoginDialog();
            }
            else {
               this.setState({invalidEmail: true});
               this.setState({invalidPassword: true});
            }
         })
         .catch(error => console.error(error));

      }
   }

   register = () => {
      console.log("register");
      const email = this.state.email;
      const password = this.state.password;
      const rememberme = this.state.rememberme;
      let error = false;

      if (!email || !email.match(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/)) {
         this.setState({invalidEmail: true});
         error = true;
      }
      else {
         this.setState({invalidEmail: false});
      }

      if (!password) {
         this.setState({invalidPassword: true});
         error = true;
      }
      else {
         this.setState({invalidPassword: false});
      }

      if (!error) {
         fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
               "email": email,
               "password": password,
               "setCookie": rememberme
            })
         })
         .then(response => response.json())
         .then(data => {
            if (data && data.registered) {
               this.setState({ loggedin: true});
               this.getEvents();
               this.handleHideLoginDialog();
            }
            else {
               this.setState({invalidEmail: true});
            }
         })
         .catch(error => console.error(error));

      }
   }

   logout = () => {
      fetch('/api/logout', {
         method: 'GET'
      })
      .then(response => {
         this.setState({ loggedin: false, email: "", password: "", sidebarEvents: [] });
         this.calendar.current.clear();
         this.handleShowLoginDialog();
      })
      .catch(error => console.error(error));
   }

   switchModal = () => {
      if (this.state.isRegisterDialog) {
         this.setState({ isRegisterDialog: false });
      }
      else {
         this.setState({ isRegisterDialog: true});
      }
   }

   renderCreateEventModal = () => {
      return (
         <div>
            <Modal
               aria-labelledby="Event Creator"
               aria-describedby="Event creation modal"
               open={this.state.showAddDialog}
               onClose={this.handleHideAddDialog}
            >
               <div className="modal event-modal">
                  <Typography variant="h5" className="modal-header">
                     Add Event
                  </Typography>
                  <div className="modal-body">
                     <input className={`${this.state.missingTitle ? 'error' : 'default'}`} type="text" placeholder="Event Title" onChange={this.onEventTitleChange}></input>
                     <input className="default" type="text" placeholder="Location" onChange={this.onEventLocationChange}></input>
                     <DateTimePicker className="date"
                        value={this.state.date}
                        onChange={this.onDateChange}
                        locale="US"
                        calendarIcon={null}
                        clearIcon={null}
                        disableClock={true}
                     />
                     <Button onClick={this.saveEvent} color="primary" variant="contained" size="small" className="save">
                        <SaveIcon/>
                        <span>Save</span>
                     </Button>
                  </div>
               </div>
            </Modal>
         </div>
      );
   }

   renderLoginModal = () => {
      return(
         <div>
            <Modal
               aria-labelledby="Login"
               aria-describedby="Login and Register modal"
               open={this.state.showLoginDialog}
               onClose={this.handleHideLoginDialog}
               disableBackdropClick={true}
            >
               <div className={`modal ${!this.state.isRegisterDialog ? "login-modal" : "register-modal"}`}>
                  <Typography variant="h5" className="modal-header">
                     {!this.state.isRegisterDialog ? 'Sign in' : 'Register'}
                  </Typography>
                  <div className="modal-body">
                     <form className="signin-form">
                        <TextField
                           error={this.state.invalidEmail}
                           required
                           ref={this.email}
                           id="email-input"
                           label="Email"
                           type="email"
                           margin="normal"
                           className="inputbox"
                           onChange={(text) => this.setState({email: text.target.value})}
                        />
                        <TextField
                           required
                           error={this.state.invalidPassword}
                           ref={this.password}
                           id="password-input"
                           label="Password"
                           type="password"
                           margin="normal"
                           className="inputbox"
                           onChange={(text) => this.setState({password: text.target.value})}
                        />
                        <FormControlLabel
                           control={
                              <Checkbox
                                 value="rememberme"
                                 color="primary"
                                 className="inputbox"
                                 checked={this.state.rememberme}
                                 onChange={(event) => this.setState({rememberme: event.target.checked})}
                              />
                           }
                           label="Remember Me"
                        />
                        <Button className="signin" variant="contained" onClick={!this.state.isRegisterDialog ? this.signin : this.register}>
                           {!this.state.isRegisterDialog ? 'Sign in' : 'Register'}
                        </Button>
                        <Button className="switch" size="small" color="default" variant="contained" onClick={this.switchModal}>
                           {!this.state.isRegisterDialog ? 'Register' : 'Sign in' }
                        </Button>
                     </form>
                  </div>
               </div>
            </Modal>
         </div>
      );
   }

   renderMain = () => {
      return (
         <div className="calendarApp">
            {this.renderCreateEventModal()}
            {this.renderLoginModal()}
            <div className="header">
               <p>Calendar</p>
               { this.state.loggedin ? <Button className="login" variant="contained" color="primary" onClick={this.logout}>Log out</Button> : null}
            </div>
            <Grid container spacing={24} className="grid">
               <Grid item sm={2} className="grid1">
                  <div className="event-button">
                     <Button variant="outlined" color="primary" onClick={this.handleShowAddDialog} className="create-event">
                        <AddIcon />
                        Create Event
                     </Button>
                  </div>
                  <div className="event-list">
                     <span className="sidebarDate">{this.state.sidebarDate}</span>
                     <div className="sidebarEvents">{this.state.sidebarEvents}</div>
                  </div>
               </Grid>
               <Grid item sm={10} className="grid2">
                  <Calendar ref={this.calendar} onChange={this.calendarChange}/>
               </Grid>
            </Grid>
         </div>
      );
   }

   renderLoading = () => {
      return (
         <div className="loaderDiv">
            <ScaleLoader
               color={'#006edc'}
               className="loader"
               height={100}
               width={12}
            />
         </div>
      );
   }

   render() {
      return (
         <div className="main">
            {!this.state.loading ? this.renderMain() : this.renderLoading()}
         </div>
      );
   }
}

export default App;
