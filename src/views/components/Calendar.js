import React from 'react';
import dateFns from "date-fns";

import './../../css/Calendar.css';

const hashFormat = "M-D-YYYY";

//Calendar template taken from https://blog.flowandform.agency/create-a-custom-calendar-in-react-3df1bfd0b728
class Calendar extends React.Component {
   constructor() {
      super();

      this.state = {
         events: {},
         month: new Date(),
         selectedDate: new Date()
      }
   }

   componentDidMount() {
      this.callback();
   }

   renderHeader = () => {
      const format = "MMMM YYYY"; //January 2018, February 2018, etc...

      return (
         <div className="calendar-header row flex-middle">
            <div className="col col-start">
               <div className="arrow left" onClick={this.getPrevMonth}><p>&larr;</p></div>
            </div>
            <div className="col col-mid">
               <p>{dateFns.format(this.state.month, format)}</p>
            </div>
            <div className="col col-end" onClick={this.nextMonth}>
               <div className="arrow right" onClick={this.getNextMonth}><p>&rarr;</p></div>
            </div>
         </div>
      );
   }

   renderDayNames = () => {
      const format = "dddd"; //Sunday, Monday, etc...
      const daysPerWeek = 7;
      const dayNames = [];

      let dayname = dateFns.startOfWeek(this.state.month);

      for (let i = 0; i < daysPerWeek; i++) {
         dayNames.push(<div className="col col-mid" key={i}>{dateFns.format(dateFns.addDays(dayname, i), format)}</div>)
      }

      return (
         <div className="row dayNames">{dayNames}</div>
      );
   }

   openEventDetails = (title, day) => {
      //TODO open modal
   }

   renderDays = () => {
      const format = "DD";
      const gridRows = [];
      const daysPerWeek = 7;
      const { month, selectedDate } = this.state;
      const startOfMonth = dateFns.startOfMonth(month);
      const endOfMonth = dateFns.endOfMonth(month);
      const gridStart = dateFns.startOfWeek(startOfMonth);
      const gridEnd = dateFns.endOfWeek(endOfMonth);

      let days = [];
      let day = gridStart;

      while (day <= gridEnd) {
         for (let i = 0; i < daysPerWeek; i++) {
            const cellDay = day;
            const dateString = dateFns.format(cellDay, format);
            const isSelected = !dateFns.isSameMonth(cellDay, startOfMonth) ? "disabled" : dateFns.isSameDay(cellDay, selectedDate) ? "selected" : "default"; 
            
            let events = [];
            const hashString = dateFns.format(cellDay, hashFormat);
            const eventList = this.state.events[hashString];
            if (eventList) {
               // eventList = eventList.sort((a, b) => new Date(a.time) - new Date(b.time));
               for (let j = 0; j < eventList.length; j++) {
                  const timeFormat = "h:mm A";
                  let day = eventList[j].time;
                  let timeString = dateFns.format(day, timeFormat);
                  let title = eventList[j].title;
                  let location = eventList[j].location;

                  let today = new Date();
                  if (day < dateFns.startOfDay(today)) {
                     events.push(
                        <div className="event-past" key={day} onClick={this.openEventDetails(title, day)}>
                           <span className="event-title">{eventList.length}</span>
                        </div>
                     );
                     break;
                  }
                  else {
                     events.push(
                        <div className="event" key={day} onClick={this.openEventDetails(title, day)}>
                           {title ? <span className="event-title">{title}</span> : null}
                           {title ? <br/> : null}
                           <span className="event-time">{timeString}</span>
                           {location ? <br/> : null}
                           {location ? <span className="event-time">{'Where: ' + location}</span> : null}
                        </div>
                     );
                  }
               }
            }
            
            days.push(
               <div className={`col cell ${isSelected}`} key={day} onClick={() => this.onClickDay(cellDay)}>
                  <p className="dayNumber">{dateString}</p>
                  <div className="events">{events}</div>
               </div>
            );
            day = dateFns.addDays(day, 1);
         }
         gridRows.push(
            <div className="row" key={day}>{days}</div>
         );
         days = [];
      }
      return (<div className="grid">{gridRows}</div>);
   }

   onClickDay = day => {
      if (!dateFns.isSameMonth(day, this.state.month)) {
         const prevMonth = dateFns.subMonths(this.state.month, 1);
         if (dateFns.isSameMonth(day, prevMonth)) {
            this.getPrevMonth();
         }
         else {
            this.getNextMonth();
         }
      }

      this.setState({
         selectedDate: day
      });

      console.log("test: " + this.state.selectedDate);

      this.callback(day);
   }

   callback = (day=null) => {
      if (this.props.onChange && typeof this.props.onChange === 'function') {
         if (day) {
            const hashString = dateFns.format(day, hashFormat);
            const eventList = this.state.events[hashString];
            this.props.onChange(day, eventList);
         }
         else {
            const hashString = dateFns.format(this.state.selectedDate, hashFormat);
            const eventList = this.state.events[hashString];
            this.props.onChange(this.state.selectedDate, eventList);
         }
      }
   }

   getNextMonth = () => {
      this.setState({month: dateFns.addMonths(this.state.month, 1)});
   }

   getPrevMonth = () => {
      this.setState({month: dateFns.subMonths(this.state.month, 1)});
   }

   addEvent = (id, title, day, location) => {
      console.log(id);
      const dateString = dateFns.format(day, hashFormat);
      let events = this.state.events;
      if (dateString in events) {
         if (!events[dateString].some(e => e.id === id)) {
            events[dateString].push({id: id, title: title, time: day, location: location});
         }
      }
      else {
         events[dateString] = [{id: id, title: title, time: day, location: location}];
      }
      events[dateString] = events[dateString].sort((a, b) => new Date(a.time) - new Date(b.time));
      this.setState({events: events});

      if (dateFns.isSameDay(day, this.state.selectedDate)) {
         this.callback(day);
      }
   }

   clear = () => {
      this.setState({ events: {} });
   }

   render() {
      return (
         <div className="calendar">
            {this.renderHeader()}
            {this.renderDayNames()}
            {this.renderDays()}
         </div>
      );
   }
}

export default Calendar;