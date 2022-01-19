import React from "react";
import RuleComponent from "./RuleComponent";
import { map, isEmpty, toUpper } from "lodash";
import { Box, Grid } from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import IconButton from "../IconButton";
import CompoundRuleConjunctionComponent from "./CompoundRuleConjunctionComponent";
import { useDeclarativeRuleDispatch } from "./DeclarativeRuleContext";
import DeleteIcon from "@material-ui/icons/Delete";
import Colors from "../../../dataEntryApp/Colors";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";

const CompoundRuleComponent = ({ compoundRule, conditionIndex, ...props }) => {
  const dispatch = useDeclarativeRuleDispatch();
  const { conjunction, rules } = compoundRule;

  const onCompoundRuleConjunctionChange = event => {
    const conjunction = event.target.value;
    dispatch({ type: "compoundRuleConjunctionChange", payload: { conjunction, conditionIndex } });
  };

  const onConditionDelete = () =>
    dispatch({ type: "deleteCondition", payload: { conditionIndex } });

  return (
    <Box component={"div"} m={1} border={1} p={2}>
      {conditionIndex !== 0 && (
        <Grid item container justify={"flex-end"}>
          <Button size="small" onClick={onConditionDelete}>
            <DeleteIcon style={{ color: Colors.ValidationError }} />
          </Button>
        </Grid>
      )}
      <CompoundRuleConjunctionComponent
        onConjunctionChange={onCompoundRuleConjunctionChange}
        value={conjunction}
      />
      <Grid container direction={"column"}>
        {map(rules, (rule, index) => (
          <Grid item container direction={"column"} spacing={3}>
            {index !== 0 && (
              <Grid item container justify={"center"}>
                <Chip color="primary" label={toUpper(compoundRule.conjunction)} />
              </Grid>
            )}
            <Grid item key={index}>
              <RuleComponent rule={rule} ruleIndex={index} conditionIndex={conditionIndex} />
            </Grid>
          </Grid>
        ))}
      </Grid>
      <IconButton
        Icon={AddCircleIcon}
        label={"Add new rule"}
        onClick={() => dispatch({ type: "addNewRule", payload: { conditionIndex } })}
        disabled={isEmpty(conjunction)}
      />
    </Box>
  );
};

export default CompoundRuleComponent;
