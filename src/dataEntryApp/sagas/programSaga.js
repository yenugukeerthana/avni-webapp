import { all, call, fork, put, select, takeLatest, takeEvery } from "redux-saga/effects";
import {
  types,
  setPrograms,
  setProgramEnrolment,
  setProgramEncounters,
  setProgramEncounterForm,
  getProgramEncounters,
  setProgramEncounter
} from "../reducers/programReducer";
import api from "../api";
import {
  selectProgramEncounterFormMappingForSubjectType,
  selectProgramUUID
} from "./programEncounterSelector";
import { mapForm } from "../../common/adapters";
import _, { find, get, isNil, filter } from "lodash";
import moment from "moment";
import { ProgramEncounter, ProgramEnrolment, ObservationsHolder, Concept } from "avni-models";
import { ModelGeneral as General } from "avni-models";

export default function*() {
  yield all(
    [
      programFetchWatcher,
      //programEncounterOnLoadWatcher,
      programEnrolmentFetchWatcher,
      programEncounterFetchWatcher,
      programEncounterFetchFormWatcher,
      updateEncounterObsWatcher,
      saveProgramEncounterWatcher
    ].map(fork)
  );
}

export function* programFetchWatcher() {
  yield takeLatest(types.GET_PROGRAMS, programFetchWorker);
}

export function* programFetchWorker({ subjectUuid }) {
  const programs = yield call(api.fetchPrograms, subjectUuid);
  yield put(setPrograms(programs));
}

export function* programEncounterFetchWatcher() {
  yield takeLatest(types.GET_PROGRAM_ENCOUNTERS, ProgramEncounterFetchWorker);
}

export function* ProgramEncounterFetchWorker({ subjectTypeName, programUuid }) {
  const programEncounterFormMapping = yield select(
    selectProgramEncounterFormMappingForSubjectType(subjectTypeName, programUuid)
  );
  yield put(setProgramEncounters(programEncounterFormMapping));
  console.log("Printing FM");
  console.log(programEncounterFormMapping);
}

export function* programEnrolmentFetchWatcher() {
  yield takeLatest(types.GET_PROGRAM_ENROLMENT, programEnrolmentFetchWorker);
}

export function* programEnrolmentFetchWorker({ enrolmentUuid }) {
  const programEnrolment = yield call(api.fetchProgramEnrolment, enrolmentUuid);
  console.log("programVisists", programEnrolment);
  yield put(setProgramEnrolment(programEnrolment));
}

// For ProgramEncounter
export function* programEncounterFetchFormWatcher() {
  yield takeLatest(types.GET_PROGRAM_ENCOUNTER_FORM, programEncounterFetchFormWorker);
}

export function* programEncounterFetchFormWorker({ encounterTypeUuid, enrolmentUuid }) {
  const formMapping = yield select(state =>
    find(
      get(state, "dataEntry.metadata.operationalModules.formMappings"),
      fm =>
        !isNil(encounterTypeUuid) &&
        (fm.encounterTypeUUID === encounterTypeUuid && fm.formType === "ProgramEncounter")
    )
  );
  const programEncounterForm = yield call(api.fetchForm, formMapping.formUUID);
  yield put(setProgramEncounterForm(mapForm(programEncounterForm)));

  const encounterType = yield select(state =>
    find(
      //get takes state from store you can print this
      get(state, "dataEntry.metadata.operationalModules.encounterTypes"),
      (
        eT //this is function fm is parameter it is just like map form uuid from saga
      ) => eT.uuid === formMapping.encounterTypeUUID
    )
  );

  //Creating New programEncounter Object for Planned Encounter
  const plannedEncounters = yield select(
    state => state.dataEntry.programs.programEnrolment.programEncounters
  );

  const planEncounter = find(
    plannedEncounters,
    pe => !isNil(pe.encounterType) && pe.encounterType.uuid === encounterTypeUuid
  );

  if (planEncounter) {
    let plannedVisit = new ProgramEncounter();
    plannedVisit.uuid = planEncounter.uuid;
    plannedVisit.encounterType = planEncounter.encounterType; //select(state => state.operationalModules.encounterTypes.find(eT => eT.uuid = encounterTypeUuid));
    plannedVisit.encounterDateTime = moment().toDate(); //new Date(); or planEncounter.encounterDateTime
    plannedVisit.earliestVisitDateTime = planEncounter.earliestVisitDateTime;
    plannedVisit.maxVisitDateTime = planEncounter.maxVisitDateTime;
    plannedVisit.name = planEncounter.name;
    const programEnrolment = new ProgramEnrolment();
    programEnrolment.uuid = enrolmentUuid;
    plannedVisit.programEnrolment = programEnrolment;
    plannedVisit.observations = [];
    yield put.resolve(setProgramEncounter(plannedVisit));
  }

  // let programEnrolment = ProgramEnrolment.createEmptyInstance({ individual: subject, program });
  // yield put.resolve(setProgramEnrolment(programEnrolment));

  console.log("plannedEncounters", plannedEncounters);
  // plannedEncounters.map(planEncounter => {
  //   const plannedVisit = new ProgramEncounter();
  //   plannedVisit.uuid = planEncounter.uuid;
  //   plannedVisit.encounterType = planEncounter.encounterType; //select(state => state.operationalModules.encounterTypes.find(eT => eT.uuid = encounterTypeUuid));
  //   plannedVisit.encounterDateTime = moment().toDate(); //new Date(); or planEncounter.encounterDateTime
  //   plannedVisit.earliestVisitDateTime = planEncounter.earliestVisitDateTime;
  //   plannedVisit.maxVisitDateTime = planEncounter.maxVisitDateTime;
  //   plannedVisit.name = planEncounter.name;
  //   const programEnrolment = new ProgramEnrolment();
  //   programEnrolment.uuid = enrolmentUuid;
  //   plannedVisit.programEnrolment = programEnrolment;
  //   plannedVisit.observations = [];
  //   plannedEncounterList.push(plannedVisit);
  // });

  //   yield select(state => {
  //     console.log("dataEntry.programs.programEnrolment.programEncounters",
  // state.dataEntry.programs.programEnrolment.programEncounters);

  //   });
}

function* updateEncounterObsWatcher() {
  yield takeEvery(types.UPDATE_OBS, updateEncounterObsWorker);
}

export function* updateEncounterObsWorker({ formElement, value }) {
  const state = yield select();
  const programEncounter = state.dataEntry.programs.programEncounter;
  // const validationResults = yield select(state => state.dataEntry.registration.validationResults);
  console.log("Before Program Enrolment Observations", programEncounter.observations);
  programEncounter.observations = updateObservations(
    programEncounter.observations,
    formElement,
    value
  );
  console.log("AFter Program Enrolment Observations", programEncounter.observations);

  //sessionStorage.setItem("programEnrolment", JSON.stringify(programEnrolment));
  yield put(setProgramEncounter(programEncounter));
  // yield put(
  //   setValidationResults(
  //     validate(formElement, value, programEnrolment.observations, validationResults)
  //   )
  // );
}

function updateObservations(observations, formElement, value) {
  const observationHolder = new ObservationsHolder(observations);
  if (formElement.concept.datatype === Concept.dataType.Coded && formElement.isMultiSelect()) {
    const answer = observationHolder.toggleMultiSelectAnswer(formElement.concept, value);
  } else if (
    formElement.concept.datatype === Concept.dataType.Coded &&
    formElement.isSingleSelect()
  ) {
    observationHolder.toggleSingleSelectAnswer(formElement.concept, value);
  } else if (
    formElement.concept.datatype === Concept.dataType.Duration &&
    !_.isNil(formElement.durationOptions)
  ) {
    observationHolder.updateCompositeDurationValue(formElement.concept, value);
  } else if (
    formElement.concept.datatype === Concept.dataType.Date &&
    !_.isNil(formElement.durationOptions)
  ) {
    //  addOrUpdatePrimitiveObs
    observationHolder.addOrUpdatePrimitiveObs(formElement.concept, value);
  } else {
    observationHolder.addOrUpdatePrimitiveObs(formElement.concept, value);
  }
  return observationHolder.observations;
}

export function* saveProgramEncounterWorker() {
  const state = yield select();
  const programEncounter = state.dataEntry.programs.programEncounter;

  let resource = programEncounter.toResource;
  console.log("resource", resource);

  //sessionStorage.removeItem("programEnrolment");

  // yield call(api.saveProgram, resource);
  // yield put(saveProgramComplete());
}

export function* saveProgramEncounterWatcher() {
  yield takeLatest(types.SAVE_PROGRAM_ENCOUNTER, saveProgramEncounterWorker);
}
