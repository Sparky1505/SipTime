import {
  formatStoredTime12Hour
} from "../../shared/time";

type TimePickerTriggerProps = {
  id?: string;
  label: string;
  value: string;
  disabled?: boolean;
  onClick: () => void;
};

function TriggerClockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.5v5l3.25 1.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function TimePickerTrigger(
  props: TimePickerTriggerProps
) {
  const displayValue =
    formatStoredTime12Hour(
      props.value
    );

  return (
    <button
      aria-label={
        `${props.label}, currently ${displayValue}. Open time picker.`
      }
      className="time-picker-trigger"
      disabled={props.disabled}
      id={props.id}
      onClick={props.onClick}
      type="button"
    >
      <span className="time-picker-trigger-value">
        {displayValue}
      </span>

      <span
        aria-hidden="true"
        className="time-picker-trigger-action"
      >
        <TriggerClockIcon />
        Change
      </span>
    </button>
  );
}
