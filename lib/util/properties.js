function supportsPropertyExpression({ ['property-type']: propertyType }) {
  return propertyType === 'data-driven' || propertyType === 'cross-faded-data-driven';
}

function supportsZoomExpression(spec) {
  return !!spec.expression?.parameters.includes('zoom');
}

function supportsInterpolation(spec) {
  return !!spec.expression?.interpolated;
}

module.exports = {
  supportsPropertyExpression,
  supportsZoomExpression,
  supportsInterpolation
};
