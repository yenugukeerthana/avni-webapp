import React, { Fragment } from "react";
import Grid from "@material-ui/core/Grid";
import { Rule } from "rules-config";
import { map, startCase } from "lodash";
import Select from "react-select";
import { useDeclarativeRuleDispatch } from "./DeclarativeRuleContext";
import { findOrDefault } from "../../util";

const OperatorComponent = ({ rule, ruleIndex, conditionIndex, ...props }) => {
  const dispatch = useDeclarativeRuleDispatch();

  const operators = map(Rule.operators, (v, k) => ({ value: v, label: startCase(k) }));

  const onOperatorChange = operator => {
    dispatch({ type: "operatorChange", payload: { ruleIndex, conditionIndex, operator } });
  };

  return (
    <Fragment>
      <Grid item xs={4}>
        <Select
          placeholder="Select operator"
          value={findOrDefault(operators, ({ value }) => value === rule.operator, null)}
          options={operators}
          style={{ width: "auto" }}
          onChange={({ value }) => onOperatorChange(value)}
        />
      </Grid>
    </Fragment>
  );
};

export default OperatorComponent;
