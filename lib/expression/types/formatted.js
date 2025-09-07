export class FormattedSection {
  constructor(text, scale, fontStack = null) {
    this.text = text;
    this.scale = scale;
    this.fontStack = fontStack;
  }
}

export class Formatted {
  constructor(sections) {
    this.sections = sections;
  }

  static fromString(unformatted) {
    return new Formatted([new FormattedSection(unformatted, null, null)]);
  }

  toString() {
    return this.sections.map(section => section.text).join('');
  }
}
