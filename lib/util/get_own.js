export default function getOwn(object, key) {
  return Object.hasOwn(object, key) ? object[key] : undefined;
}
