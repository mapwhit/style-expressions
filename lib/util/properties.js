export function supportsPropertyExpression({ 'property-type': propertyType }) {
  return propertyType === 'data-driven' || propertyType === 'cross-faded-data-driven';
}

export function supportsZoomExpression(spec) {
  return !!spec.expression?.parameters.includes('zoom');
}

export function supportsInterpolation(spec) {
  return !!spec.expression?.interpolated;
}
