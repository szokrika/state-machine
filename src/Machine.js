import React from "react";
import { Machine, interpret } from "xstate";

// TODO: learn to use parallel states!!!
// https://xstate.js.org/docs/guides/parallel.html

const alertMachine = Machine({
  id: "alert",
  type: "parallel",
  states: {
    escalate: {
      initial: "none",
      states: {
        none: {
          on: {
            SET_ESCALATE: "escalate",
            SET_NOTIFY: "notify"
          }
        },
        escalate: {
          on: {
            SET_ESCALATE: "escalate",
            SET_NOTIFY: "notify",
            RESET_ESCALATE: "none"
          }
        },
        notify: {
          on: {
            SET_ESCALATE: "escalate",
            SET_NOTIFY: "notify",
            RESET_ESCALATE: "none"
          }
        }
      }
    },
    email: {
      initial: "none",
      states: {
        none: { on: { TOGGLE_EMAIL: "on" } },
        on: {
          on: { TOGGLE_EMAIL: "off", RESET_EMAIL: "none" }
        },
        off: {
          on: { TOGGLE_EMAIL: "on", RESET_EMAIL: "none" }
        }
      }
    },
    sms: {
      initial: "none",
      states: {
        none: { on: { TOGGLE_SMS: "on" } },
        on: {
          on: { TOGGLE_SMS: "off", RESET_SMS: "none" }
        },
        off: {
          on: { TOGGLE_SMS: "on", RESET_SMS: "none" }
        }
      }
    }
  }
});

// copy and pastte the machine above and check state chart here:
// https://xstate.js.org/viz/

const valuesMap = {
  escalate: {
    none: "",
    escalate: "ESCALATE",
    notify: "NOTIFY"
  },
  email: {
    none: null,
    on: true,
    off: false
  },
  sms: {
    none: null,
    on: true,
    off: false
  }
};

export default class LightBulb extends React.Component {
  state = {
    current: alertMachine.initialState,
    valid: false
  };

  service = interpret(alertMachine).onTransition(current => {
    this.setState({ current }, () => this.submit());
  });

  componentDidMount() {
    this.service.start();
  }

  componentWillUnmount() {
    this.service.stop();
  }

  validate = values => {
    if (
      values.escalate !== "none" &&
      (values.email !== "none" || values.sms !== "none")
    ) {
      this.setState({ valid: true });
      return true;
    } else if (
      values.escalate === "none" &&
      (values.email !== "none" || values.sms !== "none")
    ) {
      this.setState({ valid: false });
      return true;
    } else {
      this.setState({ valid: false });
      return false;
    }
  };

  submit = () => {
    // console.log(this.state.current.value);
    const values = this.state.current.value;
    if (this.validate(values)) {
      console.log({
        escalate: valuesMap.escalate[values.escalate],
        email: valuesMap.email[values.email],
        sms: valuesMap.sms[values.sms]
      });
    } else {
      console.log("invalid");
    }
  };

  render() {
    const { current, valid } = this.state;
    const { send } = this.service;

    const selectOptions = {
      escalate: "SET_ESCALATE",
      notify: "SET_NOTIFY",
      none: "RESET_ESCALATE"
    };

    return (
      <div>
        <pre style={{ textAlign: "left" }}>
          {JSON.stringify(current.value, null, 2)}
        </pre>
        <div className="machine">
          <label>
            Select
            <select
              value={current.value.escalate}
              onChange={e => {
                if (e.target.value === "none") {
                  send("RESET_EMAIL");
                  send("RESET_SMS");
                }
                send(selectOptions[e.target.value]);
              }}
            >
              <option value="none">Select one</option>
              <option value="escalate">ESCALATE</option>
              <option value="notify">NOTIFY</option>
            </select>
          </label>
          <label>
            EMAIL
            <input
              type="checkbox"
              name="email"
              disabled={current.value.escalate === "none"}
              checked={current.value.email === "on"}
              onChange={e => {
                if (e.target.checked === false && current.value.sms !== "on") {
                  send("RESET_ESCALATE");
                }
                send("TOGGLE_EMAIL");
              }}
            />
          </label>
          <label>
            SMS
            <input
              type="checkbox"
              name="sms"
              disabled={current.value.escalate === "none"}
              checked={current.value.sms === "on"}
              onChange={e => {
                if (
                  e.target.checked === false &&
                  current.value.email !== "on"
                ) {
                  send("RESET_ESCALATE");
                }
                send("TOGGLE_SMS");
              }}
            />
          </label>
        </div>
        <div className={`validate ${valid ? "valid" : "invalid"}`}>
          {valid ? "VALID" : "INVALID"}
        </div>
      </div>
    );
  }
}
