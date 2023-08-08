'use strict';

describe("SpecimenMapper", function () {
    var specimenMapper = new Bahmni.Clinical.SpecimenMapper();
    var translate;

    describe("mapObservationToSpecimen", function () {

        var translatedMessages = {
            "CHIEF_COMPLAINT_DATA_CONCEPT_NAME_KEY": "Chief Complaint Record",
            "CHIEF_COMPLAINT_CODED_KEY": "Chief Complaint Coded",
            "SIGN_SYMPTOM_DURATION_KEY": "Sign/symptom duration",
            "CHIEF_COMPLAINT_DURATION_UNIT_KEY": "Chief Complaint Duration",
            "CHIEF_COMPLAINT_TEXT_KEY": "Chief complaint (text)",
            "CHIEF_COMPLAINT_DATA_OTHER_CONCEPT_KEY": "Other generic",
            "CHIEF_COMPLAINT_DATA_OTHER_CONCEPT_TEMPLATE_KEY": "{{chiefComplaint}} ({{chiefComplaintText}}) since {{duration}} {{unit}}",
            "CHIEF_COMPLAINT_DATA_WITHOUT_OTHER_CONCEPT_TEMPLATE_KEY": "{{chiefComplaint}} since {{duration}} {{unit}}"
        };
    
        var translate = jasmine.createSpyObj('$translate', ['instant']);
        translate.instant.and.callFake(function (key) {
            return translatedMessages[key];
        });

        it("should map observation to specimen object", function () {
            var observationData = {
                identifier: "138",
                uuid: "1647da59-ef2f-483c-aa11-62ce876b3fb7",
                existingObs: "1647da59-ef2f-483c-aa11-62ce876b3fb7",
                type: {name: "blood"},
                dateCollected: "30-11-2015",
                report: {
                    results: [{
                        concept: {name: "Bacteriology Results", shortName: "Results"},
                        groupMembers: [{
                            concept: {
                                name: "HTC result",
                                shortName: "Test Results"
                            },
                            value: {name: "Positive"}
                        }],
                        value: "Positive"
                    }]
                }
            };

            var specimen = specimenMapper.mapObservationToSpecimen(observationData, undefined, {}, null, translate);
            expect(specimen.specimenId).toBe(observationData.identifier);
            expect(specimen.specimenSource).toBe(observationData.type.name);
            expect(specimen.specimenCollectionDate).toBe(specimen.dateCollected);
            expect(specimen.sampleResult.concept).toBe(specimen.report.results[0].concept);
            expect(specimen.sampleResult.groupMembers.length).toBe(specimen.report.results[0].groupMembers.length);
        });

        it("should map observation to specimen object without sort order of obs created DateTime", function () {
            var observationData = {
                identifier: "138",
                uuid: "1647da59-ef2f-483c-aa11-62ce876b3fb7",
                existingObs: "1647da59-ef2f-483c-aa11-62ce876b3fb7",
                type: {name: "blood"},
                dateCollected: "2016-03-14",
                report: {
                    results: [
                        {
                        concept: {name: "Bacteriology Results", shortName: "Results"},
                        groupMembers: [{
                            concept: {
                                name: "Date Of AFB Smear Done",
                                shortName: "Date Of AFB Smear Done"
                            },
                            value: "2016-03-07",
                            observationDateTime: "2016-03-10T12:46:16.000+0530"
                        },
                        {
                            concept: {
                                name: "Smear test ID number",
                                shortName: "Smear test ID number"
                            },
                            value: 67,
                            observationDateTime: "2016-03-05T12:45:33.000+0530"
                        },
                        {
                            concept: {
                                name: "Smear result",
                                shortName: "Smear result"
                            },
                            value:  "Negative",
                            observationDateTime: "2016-03-14T12:45:24.000+0530"
                        }],
                        value: "2016-03-07, 67.0, Negative"
                    }]
                }
            };

            var specimen = specimenMapper.mapObservationToSpecimen(observationData, undefined, {}, true, translate);
            expect(specimen.specimenId).toBe(observationData.identifier);
            expect(specimen.specimenSource).toBe(observationData.type.name);
            expect(specimen.specimenCollectionDate).toBe(specimen.dateCollected);
            expect(specimen.sampleResult.concept).toBe(specimen.report.results[0].concept);
            expect(specimen.sampleResult.groupMembers.length).toBe(specimen.report.results[0].groupMembers.length);
            expect(specimen.sampleResult.groupMembers[0].concept.name).toBe(specimen.report.results[0].groupMembers[0].concept.name);
            expect(specimen.sampleResult.groupMembers[1].concept.name).toBe(specimen.report.results[0].groupMembers[1].concept.name);
            expect(specimen.sampleResult.groupMembers[2].concept.name).toBe(specimen.report.results[0].groupMembers[2].concept.name);
        });
    });

    describe("mapSpecimenToObservation", function () {
        it("should map specimen to observation object", function () {
            var specimenData = {
                identifier: "138",
                uuid: "1647da59-ef2f-483c-aa11-62ce876b3fb7",
                existingObs: "1647da59-ef2f-483c-aa11-62ce876b3fb7",
                type: {name: "blood"},
                dateCollected: "30-11-2015",
                typeObservation: {},
                specimenId: "138",
                specimenSource: "blood",
                specimenCollectionDate: "30-11-2015",
                sample: {additionalAttributes: []},
                report: {results: []},
                voided: true
            };

            var specimen = specimenMapper.mapSpecimenToObservation(specimenData);
            expect(specimen.specimenId).toBe(undefined);
            expect(specimen.specimenSource).toBe(undefined);
            expect(specimen.specimenCollectionDate).toBe(undefined);
            expect(specimen.voided).toBeTruthy();

        });
    });

});