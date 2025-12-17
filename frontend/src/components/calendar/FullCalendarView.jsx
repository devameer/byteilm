import React, { useRef, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useTheme } from "../../contexts/ThemeContext";

function FullCalendarView({
  events,
  onEventClick,
  onDateClick,
  onEventDrop,
  onEventResize,
  initialView = "dayGridMonth",
  calendarRef,
}) {
  const { darkMode } = useTheme();
  const internalCalendarRef = useRef(null);
  const activeRef = calendarRef || internalCalendarRef;

  const handleEventClick = useCallback(
    (clickInfo) => {
      if (onEventClick) {
        onEventClick(clickInfo.event);
      }
    },
    [onEventClick]
  );

  const handleDateClick = useCallback(
    (info) => {
      if (onDateClick) {
        onDateClick(info.date);
      }
    },
    [onDateClick]
  );

  const handleEventDrop = useCallback(
    (dropInfo) => {
      if (onEventDrop) {
        onEventDrop({
          event: dropInfo.event,
          oldEvent: dropInfo.oldEvent,
          delta: dropInfo.delta,
          revert: dropInfo.revert,
        });
      }
    },
    [onEventDrop]
  );

  const handleEventResize = useCallback(
    (resizeInfo) => {
      if (onEventResize) {
        onEventResize({
          event: resizeInfo.event,
          oldEvent: resizeInfo.oldEvent,
          endDelta: resizeInfo.endDelta,
          revert: resizeInfo.revert,
        });
      }
    },
    [onEventResize]
  );

  const calendarOptions = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      },
      buttonText: {
        today: "اليوم",
        month: "شهر",
        week: "أسبوع",
        day: "يوم",
        list: "قائمة",
      },
      locale: "ar",
      direction: "rtl",
      editable: true,
      droppable: true,
      eventResizableFromStart: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      events,
      eventClick: handleEventClick,
      dateClick: handleDateClick,
      eventDrop: handleEventDrop,
      eventResize: handleEventResize,
      height: "auto",
      contentHeight: "auto",
      aspectRatio: 1.8,
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        hour12: false,
      },
      slotLabelFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
      eventDisplay: "block",
      displayEventTime: true,
      displayEventEnd: true,
      nowIndicator: true,
      eventClassNames: (arg) => {
        const classes = ["fc-event-custom"];
        if (arg.event.extendedProps?.priority === "urgent") {
          classes.push("fc-event-urgent");
        } else if (arg.event.extendedProps?.priority === "high") {
          classes.push("fc-event-high");
        }
        if (arg.event.extendedProps?.is_lesson) {
          classes.push("fc-event-lesson");
        } else {
          classes.push("fc-event-task");
        }
        if (arg.event.extendedProps?.is_overdue) {
          classes.push("fc-event-overdue");
        }
        return classes;
      },
    }),
    [
      events,
      initialView,
      handleEventClick,
      handleDateClick,
      handleEventDrop,
      handleEventResize,
    ]
  );

  return (
    <div className="fullcalendar-wrapper relative">
      <style>{`
                .fc {
                    direction: rtl;
                    font-family: 'Cairo', 'Tajawal', sans-serif;
                    ${darkMode ? "color: #e5e7eb;" : ""}
                }

                .fc-toolbar-title {
                    font-size: 1.75rem !important;
                    font-weight: 800 !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .fc-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    border: none !important;
                    border-radius: 12px !important;
                    padding: 10px 18px !important;
                    font-weight: 700 !important;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
                    transition: all 0.3s ease !important;
                }
                
                .fc-button:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
                }
                
                .fc-button-active {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
                    box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4) !important;
                }
                
                .fc-button-primary:not(:disabled):active,
                .fc-button-primary:not(:disabled).fc-button-active {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
                }
                
                .fc-daygrid-day {
                    transition: all 0.3s ease !important;
                }
                
                .fc-daygrid-day:hover {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%) !important;
                }
                
                .fc-day-today {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
                    border: 2px solid #667eea !important;
                }
                
                .fc-daygrid-day-number {
                    font-size: 1.1rem !important;
                    font-weight: 700 !important;
                    padding: 8px !important;
                }
                
                .fc-day-today .fc-daygrid-day-number {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: 900 !important;
                }
                
                .fc-event {
                    border-radius: 8px !important;
                    padding: 4px 8px !important;
                    margin: 2px 0 !important;
                    border: none !important;
                    font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                    transition: all 0.2s ease !important;
                }
                
                .fc-event:hover {
                    transform: scale(1.05) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                    z-index: 10 !important;
                }
                
                .fc-event-urgent {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                    animation: pulse-urgent 2s infinite !important;
                }
                
                .fc-event-high {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
                }
                
                .fc-event-lesson {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
                }
                
                .fc-event-task {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
                }
                
                .fc-event-overdue {
                    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
                    animation: pulse-overdue 2s infinite !important;
                }
                
                @keyframes pulse-urgent {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                
                @keyframes pulse-overdue {
                    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                    50% { opacity: 0.9; box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
                }
                
                .fc-col-header-cell {
                    background: ${
                      darkMode
                        ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                        : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)"
                    } !important;
                    font-weight: 800 !important;
                    padding: 12px 8px !important;
                    border: none !important;
                    color: ${darkMode ? "#e5e7eb" : "#374151"} !important;
                }

                .fc-scrollgrid {
                    border: none !important;
                    ${darkMode ? "background: #1f2937;" : ""}
                }

                .fc-daygrid-day, .fc-timegrid-col {
                    ${
                      darkMode
                        ? "background: #1f2937; border-color: #374151 !important;"
                        : ""
                    }
                }

             
                .fc-daygrid-day-frame {
                    border-radius: 8px !important;
                    margin: 2px !important;
                }
                
                .fc-view-harness {
                    border-radius: 16px !important;
                    overflow: hidden !important;
                }
                
                .fc-toolbar {
                    margin-bottom: 1.5rem !important;
                    padding: 1rem !important;
                    background: ${
                      darkMode
                        ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                        : "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)"
                    };
                    border-radius: 16px !important;
                }
                
                .fc-event-title {
                    font-weight: 700 !important;
                }
                
                .fc-daygrid-more-link {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    border-radius: 6px !important;
                    padding: 2px 8px !important;
                    font-weight: 700 !important;
                    margin: 2px !important;
                }
                
                .fc-list-event:hover td {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
                }
                
                .fc-timegrid-slot {
                    height: 3em !important;
                }
                
                .fc-timegrid-event {
                    border-radius: 8px !important;
                    padding: 4px !important;
                }
            `}</style>
      <FullCalendar ref={activeRef} {...calendarOptions} />
    </div>
  );
}

export default FullCalendarView;
