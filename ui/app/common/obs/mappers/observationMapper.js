'use strict';

Bahmni.Common.Obs.ObservationMapper = function () {
    var conceptMapper = new Bahmni.Common.Domain.ConceptMapper();

    this.map = function (bahmniObservations, allConceptsConfig, dontSortByObsDateTime, $translate) {
        var mappedObservations = mapObservations(bahmniObservations, allConceptsConfig, dontSortByObsDateTime, $translate);
        return mapUIObservations(mappedObservations, allConceptsConfig);
    };

    var mapObservations = function (bahmniObservations, allConceptsConfig, dontSortByObsDateTime, $translate) {
        var mappedObservations = [];
        if (dontSortByObsDateTime) {
            bahmniObservations = _.flatten(bahmniObservations);
        } else {
            bahmniObservations = Bahmni.Common.Obs.ObservationUtil.sortSameConceptsWithObsDateTime(bahmniObservations);
        }
        $.each(bahmniObservations, function (i, bahmniObservation) {
            var conceptConfig = bahmniObservation.formFieldPath ? [] : allConceptsConfig[bahmniObservation.concept.name] || [];
            var observation = new Bahmni.Common.Obs.Observation(bahmniObservation, conceptConfig, $translate);
            if (observation.groupMembers && observation.groupMembers.length >= 0 && observation.concept.name === $translate.instant("CHIEF_COMPLAINT_DATA_CONCEPT_NAME_KEY")) {
                if (observation.groupMembers[0].value.name !== $translate.instant("CHIEF_COMPLAINT_DATA_OTHER_CONCEPT_KEY")) {
                    observation.value = $translate.instant("CHIEF_COMPLAINT_DATA_WITHOUT_OTHER_CONCEPT_TEMPLATE_KEY", {chiefComplaint: observation.groupMembers[0].value.name, duration: observation.groupMembers[1].value, unit: observation.groupMembers[2].value.name});
                } else {
                    observation.value = $translate.instant("CHIEF_COMPLAINT_DATA_OTHER_CONCEPT_TEMPLATE_KEY", {chiefComplaint: observation.groupMembers[0].value.name, chiefComplaintText: observation.groupMembers[1].value, duration: observation.groupMembers[2].value, unit: observation.groupMembers[3].value.name});
                }
                observation.groupMembers = [];
            }
            if (observation.groupMembers && observation.groupMembers.length >= 0 && observation.concept.name !== $translate.instant("CHIEF_COMPLAINT_DATA_CONCEPT_NAME_KEY")) {
                observation.groupMembers = mapObservations(observation.groupMembers, allConceptsConfig, dontSortByObsDateTime, $translate);
            }
            mappedObservations.push(observation);
        });
        return mappedObservations;
    };

    var mapUIObservations = function (observations, allConceptsConfig) {
        var groupedObservations = _.groupBy(observations, function (observation) {
            return observation.formFieldPath + "#" + observation.concept.name;
        });
        var mappedObservations = [];
        $.each(groupedObservations, function (i, obsGroup) {
            var conceptConfig = obsGroup[0].formFieldPath ? [] : allConceptsConfig[obsGroup[0].concept.name] || [];
            if (conceptConfig.multiSelect) {
                var multiSelectObservations = {};
                $.each(obsGroup, function (i, observation) {
                    if (multiSelectObservations[observation.encounterDateTime]) {
                        multiSelectObservations[observation.encounterDateTime].push(observation);
                    } else {
                        var observations = [];
                        observations.push(observation);
                        multiSelectObservations[observation.encounterDateTime] = observations;
                    }
                });
                $.each(multiSelectObservations, function (i, observations) {
                    mappedObservations.push(new Bahmni.Common.Obs.MultiSelectObservation(observations, conceptConfig));
                });
            } else if (conceptConfig.grid) {
                mappedObservations.push(new Bahmni.Common.Obs.GridObservation(obsGroup[0], conceptConfig));
            } else {
                $.each(obsGroup, function (i, obs) {
                    obs.groupMembers = mapUIObservations(obs.groupMembers, allConceptsConfig);
                    mappedObservations.push(obs);
                });
            }
        });
        return mappedObservations;
    };

    this.getGridObservationDisplayValue = function (observationTemplate) {
        var memberValues = _.compact(_.map(observationTemplate.bahmniObservations, function (observation) {
            return getObservationDisplayValue(observation);
        }));
        return memberValues.join(', ');
    };

    var getObservationDisplayValue = function (observation) {
        if (observation.isBoolean || observation.type === "Boolean") {
            return observation.value === true ? "Yes" : "No";
        }
        if (!observation.value) {
            return "";
        }
        if (typeof observation.value.name === 'object') {
            var valueConcept = conceptMapper.map(observation.value);
            return valueConcept.shortName || valueConcept.name;
        }
        return observation.value.shortName || observation.value.name || observation.value;
    };
};
