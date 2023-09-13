import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import { isEmpty } from "lodash";
import Save from "@material-ui/icons/Save";

export const SaveComponent = ({ disabledFlag, name, onSubmit, ...props }) => {
  const [saveInProgress, setSaveInProgress] = useState(false);

  const enableSaveButton = () => {
    setSaveInProgress(false);
  };
  const disableSaveButton = () => {
    setSaveInProgress(true);
  };

  const onSave = async event => {
    disableSaveButton();
    try {
      await onSubmit(event);
    } finally {
      enableSaveButton();
    }
  };

  return (
    <Button
      color="primary"
      variant="contained"
      onClick={onSave}
      style={isEmpty(props.styleClass) ? {} : props.styleClass}
      disabled={disabledFlag || saveInProgress}
      fullWidth={props.fullWidth}
      startIcon={<Save />}
    >
      {name.toUpperCase()}
    </Button>
  );
};

SaveComponent.defaultProps = {
  disabledFlag: false,
  name: "SAVE",
  styleClass: {},
  fullWidth: false
};
