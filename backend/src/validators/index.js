const authValidator = require('./authValidator');
const complaintValidator = require('./complaintValidator');

module.exports = {
  ...authValidator,
  ...complaintValidator,
};
