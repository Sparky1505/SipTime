import {
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import type {
  KeyboardEvent,
  MouseEvent
} from "react";
import {
  formatStoredTime12Hour,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  parseStoredTime,
  PERIOD_OPTIONS,
  toStoredTime
} from "../../shared/time";
import type {
  TimeWheelValue
} from "../../shared/time";
import {
  TimeWheelColumn
} from "./TimeWheelColumn";

type TimeWheelPickerProps = {
  isOpen: boolean;
  title: string;
  value: string;
  onCancel: () => void;
  onConfirm: (
    value: string
  ) => void;
};

type TimeWheelPickerDialogProps =
  Omit<
    TimeWheelPickerProps,
    "isOpen"
  >;

const DEFAULT_TIME:
  TimeWheelValue = {
    hour: 12,
    minute: 0,
    period: "PM"
  };

function getInitialValue(
  value: string
): TimeWheelValue {
  return (
    parseStoredTime(value) ?? {
      ...DEFAULT_TIME
    }
  );
}

function TimeWheelPickerDialog(
  props:
    TimeWheelPickerDialogProps
) {
  const titleId = useId();
  const descriptionId = useId();

  const dialogRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const returnFocusRef =
    useRef<HTMLElement | null>(
      null
    );

  const [
    draft,
    setDraft
  ] = useState<TimeWheelValue>(
    () =>
      getInitialValue(
        props.value
      )
  );

  /*
   * The dialog is mounted only while open.
   * This effect therefore handles only DOM
   * synchronization and focus management.
   */
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof
      HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const frameId =
      window.requestAnimationFrame(
        () => {
          dialogRef.current?.focus();
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );

      document.body.style.overflow =
        previousOverflow;

      returnFocusRef.current?.focus();
    };
  }, []);

  const storedDraft =
    toStoredTime(draft);

  const displayDraft =
    formatStoredTime12Hour(
      storedDraft
    );

  function handleBackdropMouseDown(
    event:
      MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target ===
      event.currentTarget
    ) {
      props.onCancel();
    }
  }

  function handleDialogKeyDown(
    event:
      KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancel();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialog =
      dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableElements =
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          [
            "button:not(:disabled)",
            "[tabindex='0']"
          ].join(",")
        )
      );

    if (
      focusableElements.length ===
      0
    ) {
      event.preventDefault();
      return;
    }

    const firstElement =
      focusableElements[0];

    const lastElement =
      focusableElements[
        focusableElements.length -
          1
      ];

    if (
      event.shiftKey &&
      document.activeElement ===
        firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (
      !event.shiftKey &&
      document.activeElement ===
        lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className="time-picker-backdrop"
      onMouseDown={
        handleBackdropMouseDown
      }
    >
      <div
        aria-describedby={
          descriptionId
        }
        aria-labelledby={titleId}
        aria-modal="true"
        className="time-picker-dialog"
        onKeyDown={
          handleDialogKeyDown
        }
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="time-picker-header">
          <div>
            <p className="time-picker-eyebrow">
              SipTime schedule
            </p>

            <h2
              className="water-heading text-xl"
              id={titleId}
            >
              {props.title}
            </h2>

            <p
              className="water-muted mt-1 text-xs leading-5"
              id={descriptionId}
            >
              Scroll each wheel or use
              your keyboard arrow keys.
            </p>
          </div>
        </header>

        <div
          aria-live="polite"
          className="time-picker-preview"
        >
          {displayDraft}
        </div>

        <div
          aria-label="Time selection"
          className="time-picker-wheels"
        >
          <TimeWheelColumn
            formatValue={(
              hour
            ) =>
              String(
                hour
              ).padStart(
                2,
                "0"
              )
            }
            label="Hour"
            name="hour"
            onChange={(
              hour
            ) => {
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  hour
                })
              );
            }}
            options={
              HOUR_OPTIONS
            }
            value={
              draft.hour
            }
          />

          <TimeWheelColumn
            formatValue={(
              minute
            ) =>
              String(
                minute
              ).padStart(
                2,
                "0"
              )
            }
            label="Minute"
            name="minute"
            onChange={(
              minute
            ) => {
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  minute
                })
              );
            }}
            options={
              MINUTE_OPTIONS
            }
            value={
              draft.minute
            }
          />

          <TimeWheelColumn
            label="Period"
            name="period"
            onChange={(
              period
            ) => {
              setDraft(
                (
                  current
                ) => ({
                  ...current,
                  period
                })
              );
            }}
            options={
              PERIOD_OPTIONS
            }
            value={
              draft.period
            }
          />
        </div>

        <div className="time-picker-footer">
          <button
            className="water-secondary-button h-11 px-5 text-sm font-semibold"
            onClick={
              props.onCancel
            }
            type="button"
          >
            Cancel
          </button>

          <button
            className="water-primary-button h-11 px-6 text-sm font-bold"
            onClick={() => {
              props.onConfirm(
                storedDraft
              );
            }}
            type="button"
          >
            Set time
          </button>
        </div>
      </div>
    </div>
  );
}

export function TimeWheelPicker(
  props: TimeWheelPickerProps
) {
  if (!props.isOpen) {
    return null;
  }

  return (
    <TimeWheelPickerDialog
      key={props.value}
      onCancel={
        props.onCancel
      }
      onConfirm={
        props.onConfirm
      }
      title={props.title}
      value={props.value}
    />
  );
}
