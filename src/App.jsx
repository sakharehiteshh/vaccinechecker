import { useMemo, useState } from "react";
import data from "./data/vaccines.json";
import "./App.css";

/* ---------- Age helpers ---------- */
function getExactAge(dob) {
  const d = new Date(dob);
  const now = new Date();
  if (Number.isNaN(d.getTime()) || d > now) return null;

  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  let days = now.getDate() - d.getDate();

  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  const totalMonths = years * 12 + months + (days >= 15 ? 0.5 : 0);
  return { years, months, days, totalMonths };
}

/* Column keys EXACTLY as they appear in your JSON */
const COL = {
  BIRTH_1M: "Birth— I month",
  M2_11: "2—11 months",
  M12_Y6: "12 months - 6 years",
  Y7_10: "7—10 years",
  Y11_17: "11—17 years",
  Y18_64: "18-64 years",
  Y65PLUS: ">= 65 years",
};

/* Pick the JSON column for a given age */
function columnForAge(age) {
  if (!age) return null;
  if (age.totalMonths < 2) return COL.BIRTH_1M;
  if (age.totalMonths >= 2 && age.totalMonths < 12) return COL.M2_11;
  if (age.totalMonths >= 12 && age.years < 7) return COL.M12_Y6;
  if (age.years >= 7 && age.years <= 10) return COL.Y7_10;
  if (age.years >= 11 && age.years <= 17) return COL.Y11_17;
  if (age.years >= 18 && age.years <= 64) return COL.Y18_64;
  if (age.years >= 65) return COL.Y65PLUS;
  return null;
}

/* Determine status type for styling */
function statusType(cell) {
  const txt = (cell || "").trim().toUpperCase();
  if (txt.startsWith("YES")) return "yes";
  if (txt.startsWith("SOMETIMES")) return "sometimes";
  if (txt.startsWith("NO")) return "no";
  return "info"; // fallback for any free text
}

export default function App() {
  const [dob, setDob] = useState("");

  const age = useMemo(() => (dob ? getExactAge(dob) : null), [dob]);
  const colKey = useMemo(() => columnForAge(age), [age]);

  const ageStr = age ? `${age.years}y ${age.months}m ${age.days}d` : "—";
  const bandStr = useMemo(() => {
    switch (colKey) {
      case COL.BIRTH_1M: return "Birth to 1 month";
      case COL.M2_11: return "2–11 months";
      case COL.M12_Y6: return "12 months–6 years";
      case COL.Y7_10: return "7–10 years";
      case COL.Y11_17: return "11–17 years";
      case COL.Y18_64: return "18–64 years";
      case COL.Y65PLUS: return "≥65 years";
      default: return "—";
    }
  }, [colKey]);

  return (
    <div className="page">
      <header className="header">
        <h1>Age-Based Vaccine Checker</h1>
        <p className="sub">
          Enter date of birth to calculate exact age and see the vaccine indications for that age band
          (rendered directly from your JSON table, including <strong>NO</strong> rows).
        </p>
      </header>

      <main className="card">
        <div className="formRow">
          <label htmlFor="dob" className="label">Date of Birth</label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="input"
            max={new Date().toISOString().slice(0,10)}
          />
        </div>

        <div className="ageRow">
          <div className="pill">
            <span className="pillLabel">Exact Age:</span>
            <span className="pillValue">{ageStr}</span>
          </div>
          <div className="pill alt">
            <span className="pillLabel">Age Band:</span>
            <span className="pillValue">{bandStr}</span>
          </div>
        </div>

        <section className="results">
  <h2>Vaccines (from table)</h2>

  {!colKey ? (
    <div className="empty">Enter a valid DOB to view results.</div>
  ) : (() => {
    const grouped = data.reduce(
      (acc, row) => {
        const vaccine = row["Vaccines by applicant"];
        const cell = row[colKey] || "";
        const t = statusType(cell);
        const item = { vaccine, cell, type: t };
        if (t === "yes") acc.yes.push(item);
        else if (t === "no") acc.no.push(item);
        else acc.other.push(item);
        return acc;
      },
      { yes: [], no: [], other: [] }
    );

    return (
      <>

              
      {/* ---------- LABS SECTION ---------- */}
      <section className="results" style={{ marginTop: "32px" }}>
        <h2>Recommended Labs</h2>

        {!age ? (
          <div className="empty">Enter a valid DOB to view lab recommendations.</div>
        ) : (
          (() => {
            const yrs = age.years;

            const labs = [];

            // Quantiferon
            if (yrs >= 2) {
              labs.push({
                name: "Quantiferon Gold TB Test",
                reason: "Recommended for ages 2 years and older",
              });
            }

            // RPR Syphilis
            if (yrs >= 18 && yrs <= 44) {
              labs.push({
                name: "RPR Syphilis Test",
                reason: "Recommended for ages 18–44",
              });
            }

            // NAAT Gonorrhoea
            if (yrs >= 18 && yrs <= 24) {
              labs.push({
                name: "NAAT Gonorrhoea Test",
                reason: "Recommended for ages 18–24",
              });
            }

            return labs.length === 0 ? (
              <div className="empty">No lab tests are required for this age.</div>
            ) : (
              <ul className="labList">
                {labs.map((lab, i) => (
                  <li key={i} className="labItem">
                    <div className="labName">{lab.name}</div>
                    <div className="labNote">{lab.reason}</div>
                  </li>
                ))}
              </ul>
            );
          })()
        )}
      </section>

        <div className="twoCol">
          {/* LEFT: YES (Required) */}
          <div className="col">
            <div className="colHeader">
              <h3>YES (Required)</h3>
              <span className="pillCount">{grouped.yes.length}</span>
            </div>
            {grouped.yes.length === 0 ? (
              <div className="empty sub">No required vaccines in this band.</div>
            ) : (
              <ul className="vaxList">
                {grouped.yes.map((it, idx) => (
                  <li key={`yes-${idx}`} className="vaxItem">
                    <div className="vaxHeader">
                      <div className="vaxName">{it.vaccine}</div>
                      <span className={`status yes`}>YES</span>
                    </div>
                    <div className="vaxNote">{it.cell}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT: NO (Not Required) */}
          <div className="col">
            <div className="colHeader">
              <h3>NO (Not Required)</h3>
              <span className="pillCount">{grouped.no.length}</span>
            </div>
            {grouped.no.length === 0 ? (
              <div className="empty sub">No “not required” items in this band.</div>
            ) : (
              <ul className="vaxList">
                {grouped.no.map((it, idx) => (
                  <li key={`no-${idx}`} className="vaxItem">
                    <div className="vaxHeader">
                      <div className="vaxName">{it.vaccine}</div>
                      <span className={`status no`}>NO</span>
                    </div>
                    <div className="vaxNote">{it.cell}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>



        {/* Optional: show “Sometimes / Info” below to keep your data complete */}
        {grouped.other.length > 0 && (
          <div className="otherSection">
            <h4>Case-by-case / Info</h4>
            <ul className="vaxList">
              {grouped.other.map((it, idx) => (
                <li key={`other-${idx}`} className="vaxItem">
                  <div className="vaxHeader">
                    <div className="vaxName">{it.vaccine}</div>
                    <span className={`status ${it.type}`}>
                      {it.type === "sometimes" ? "SOMETIMES" : "INFO"}
                    </span>
                  </div>
                  <div className="vaxNote">{it.cell || "—"}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  })()}

  {/* Legend / Notes (unchanged) */}
  <section className="legendCard">
    <button
      className="legendHeader"
      type="button"
      onClick={(e) => {
        const card = e.currentTarget.closest(".legendCard");
        card?.classList.toggle("open");
      }}
    >
      <span>Notes & Abbreviations</span>
      <svg width="16" height="16" viewBox="0 0 24 24" className="chev">
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>

    <div className="legendBody">
      {/* ... keep your existing legend body as-is ... */}
    </div>
  </section>

  <p className="disclaimer">
    Displayed content mirrors your JSON exactly for the selected age band. Clinical decisions should follow
    current ACIP/CDC guidance and individual risk factors.
  </p>
</section>

      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Vaccine helper</span>
      </footer>
    </div>
  );
}
