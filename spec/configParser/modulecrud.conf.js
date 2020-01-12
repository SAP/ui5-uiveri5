exports.config = {
  enableKey: {
    enabled: [{name: 'optionToEnable-file'}]
  },
  enableArr: [{name: 'optionToEnable-file'}],
  enableMix1: [{name: 'optionToEnable-file'}],
  enableMix2: {
    enabled: [{name: 'optionToEnable-file'}]
  },
  disableArr: [{name: 'optionToRemain'}, {name: 'optionToDisable'}],
  disableKey: {
    enabled: [{name: 'optionToRemain'}, {name: 'optionToDisable'}]
  },
  updateArr: [{name: 'optionToUpdate', existingKey: "value2", updateKey: "prevValue"}],
  updateKey: {
    enabled: [{name: 'optionToUpdate', existingKey: "value2", updateKey: "prevValue"}]
  },
  updateArrID: [{name: 'optionWithID1', existingKey: "value2", updateKey: "prevValue", id: "prevID"}],
  updateKeyID: {
    enabled: [{name: 'optionWithID2', existingKey: "value2", updateKey: "prevValue", id: "prevID"}]
  }
};
