import { Fragment, type CSSProperties } from "react";

/** Headline whose words rise into place one after another (static for reduced motion). */
export function RiseWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="rise-mask">
            <span className="rise-word" style={{ "--i": i } as CSSProperties}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export const riseDelay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;
