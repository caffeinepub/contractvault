import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { contracts, obligations } from "../data/seed";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  draft: "bg-slate-400",
  expired: "bg-red-500",
  terminated: "bg-zinc-400",
  underReview: "bg-amber-500",
};

const PADDING_KEYS = ["p0", "p1", "p2", "p3", "p4", "p5", "p6"];

type DayEvent = {
  label: string;
  type: "contract" | "obligation";
  color: string;
  contractId?: string;
};

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const eventsByDay: Record<number, DayEvent[]> = {};

  for (const c of contracts) {
    const d = new Date(c.endDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push({
        label: c.title,
        type: "contract",
        color: STATUS_COLORS[c.status] ?? "bg-slate-400",
        contractId: c.id,
      });
    }
  }

  for (const o of obligations) {
    const d = new Date(o.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push({
        label: o.title,
        type: "obligation",
        color: o.status === "overdue" ? "bg-red-500" : "bg-indigo-500",
        contractId: o.contractId,
      });
    }
  }

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const paddingKeys = PADDING_KEYS.slice(0, firstDay);
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  return (
    <div className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="calendar.prev_button"
            onClick={prevMonth}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-sm font-medium text-slate-700 w-36 text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            data-ocid="calendar.next_button"
            onClick={nextMonth}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        {selectedDay && (
          <button
            type="button"
            data-ocid="calendar.close_panel_button"
            onClick={() => setSelectedDay(null)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
          >
            <X className="w-3 h-3" /> Close panel
          </button>
        )}
      </div>

      <div
        className={cn("flex gap-4", selectedDay ? "flex-col lg:flex-row" : "")}
      >
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-200">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {paddingKeys.map((k) => (
                <div
                  key={k}
                  className="min-h-20 border-r border-b border-slate-100 bg-slate-50/50"
                />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday =
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === day;
                const isSelected = selectedDay === day;
                const events = eventsByDay[day] ?? [];
                return (
                  <button
                    key={day}
                    type="button"
                    data-ocid={`calendar.day.${day}`}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "min-h-20 border-r border-b border-slate-100 p-1.5 text-left w-full focus:outline-none",
                      isSelected
                        ? "bg-indigo-50 ring-1 ring-indigo-400 ring-inset"
                        : "hover:bg-slate-50",
                      isToday && !isSelected && "bg-indigo-50/50",
                    )}
                  >
                    <div
                      className={cn(
                        "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1",
                        isToday ? "bg-indigo-600 text-white" : "text-slate-600",
                      )}
                    >
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev) => (
                        <div
                          key={`${ev.type}-${ev.label}`}
                          title={ev.label}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded text-white truncate",
                            ev.color,
                          )}
                        >
                          {ev.label}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-xs text-slate-400">
                          +{events.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 mt-3 text-sm text-slate-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Active contract
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Under review
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Obligation due
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Overdue/Expired
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay !== null && (
          <div
            data-ocid="calendar.day_panel"
            className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-lg p-4 self-start"
          >
            <div className="text-sm font-semibold text-slate-800 mb-3">
              {MONTH_NAMES[month]} {selectedDay}, {year}
            </div>
            {selectedEvents.length === 0 ? (
              <div
                data-ocid="calendar.day_panel.empty_state"
                className="text-sm text-slate-400 py-4 text-center"
              >
                No events on this day.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev, i) => (
                  <div
                    key={`${ev.type}-${ev.label}-${i}`}
                    data-ocid={`calendar.day_event.${i + 1}`}
                    className="flex items-start gap-2.5 rounded-md border border-slate-100 px-2.5 py-2"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        ev.color,
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 leading-snug">
                        {ev.label}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide",
                            ev.type === "contract"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {ev.type === "contract" ? "Contract" : "Obligation"}
                        </span>
                      </div>
                      {ev.contractId && (
                        <Link
                          to="/contracts/$contractId"
                          params={{ contractId: ev.contractId }}
                          data-ocid={`calendar.day_event.link.${i + 1}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 block"
                        >
                          View contract &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
