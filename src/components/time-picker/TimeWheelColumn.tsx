import {
  useEffect,
  useId,
  useRef
} from "react";
import type {
  KeyboardEvent
} from "react";

const ITEM_HEIGHT = 44;
const PAGE_STEP = 5;

type WheelOption =
  | string
  | number;

type TimeWheelColumnProps<
  T extends WheelOption
> = {
  label: string;
  name: string;
  options: readonly T[];
  value: T;
  formatValue?: (
    value: T
  ) => string;
  onChange: (
    value: T
  ) => void;
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

export function TimeWheelColumn<
  T extends WheelOption
>(
  props: TimeWheelColumnProps<T>
) {
  const labelId = useId();
  const optionIdPrefix = useId();

  const wheelRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const scrollTimeoutRef =
    useRef<number | null>(null);

  const selectedIndex =
    Math.max(
      0,
      props.options.findIndex(
        (option) =>
          option === props.value
      )
    );

  function getDisplayValue(
    option: T
  ): string {
    return props.formatValue
      ? props.formatValue(option)
      : String(option);
  }

  function scrollToIndex(
    index: number,
    behavior: ScrollBehavior
  ) {
    wheelRef.current?.scrollTo({
      top:
        index *
        ITEM_HEIGHT,
      behavior
    });
  }

  function selectIndex(
    requestedIndex: number,
    behavior:
      ScrollBehavior = "smooth"
  ) {
    const index = clamp(
      requestedIndex,
      0,
      props.options.length - 1
    );

    const option =
      props.options[index];

    if (option === undefined) {
      return;
    }

    props.onChange(option);

    scrollToIndex(
      index,
      behavior
    );
  }

  useEffect(() => {
    scrollToIndex(
      selectedIndex,
      "auto"
    );
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (
        scrollTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          scrollTimeoutRef.current
        );
      }
    };
  }, []);

  function handleScroll() {
    const wheel =
      wheelRef.current;

    if (!wheel) {
      return;
    }

    if (
      scrollTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        scrollTimeoutRef.current
      );
    }

    const scrollTop =
      wheel.scrollTop;

    scrollTimeoutRef.current =
      window.setTimeout(() => {
        const index = clamp(
          Math.round(
            scrollTop /
              ITEM_HEIGHT
          ),
          0,
          props.options.length - 1
        );

        const option =
          props.options[index];

        if (
          option !== undefined &&
          option !== props.value
        ) {
          props.onChange(option);
        }

        scrollToIndex(
          index,
          "smooth"
        );
      }, 90);
  }

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLDivElement>
  ) {
    let nextIndex:
      | number
      | null = null;

    switch (event.key) {
      case "ArrowUp":
        nextIndex =
          selectedIndex - 1;
        break;

      case "ArrowDown":
        nextIndex =
          selectedIndex + 1;
        break;

      case "PageUp":
        nextIndex =
          selectedIndex -
          PAGE_STEP;
        break;

      case "PageDown":
        nextIndex =
          selectedIndex +
          PAGE_STEP;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex =
          props.options.length -
          1;
        break;

      default:
        return;
    }

    event.preventDefault();

    selectIndex(nextIndex);
  }

  return (
    <div className="time-wheel-column">
      <p
        className="time-wheel-label"
        id={labelId}
      >
        {props.label}
      </p>

      <div className="time-wheel-shell">
        <div
          aria-hidden="true"
          className="time-wheel-selection"
        />

        <div
          aria-activedescendant={
            `${optionIdPrefix}-option-${selectedIndex}`
          }
          aria-labelledby={labelId}
          aria-orientation="vertical"
          className="time-wheel-scroll"
          data-time-wheel={
            props.name
          }
          onKeyDown={
            handleKeyDown
          }
          onScroll={
            handleScroll
          }
          ref={wheelRef}
          role="listbox"
          tabIndex={0}
        >
          {props.options.map(
            (
              option,
              index
            ) => {
              const selected =
                index ===
                selectedIndex;

              return (
                <div
                  aria-posinset={
                    index + 1
                  }
                  aria-selected={
                    selected
                  }
                  aria-setsize={
                    props.options.length
                  }
                  className="time-wheel-option"
                  data-selected={
                    selected
                  }
                  id={
                    `${optionIdPrefix}-option-${index}`
                  }
                  key={
                    String(option)
                  }
                  onClick={() => {
                    selectIndex(
                      index
                    );
                  }}
                  role="option"
                >
                  {getDisplayValue(
                    option
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
