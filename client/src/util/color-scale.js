import * as d3ScaleChromatic from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";

const colorScale = d3Scale.scaleSequential(d3ScaleChromatic.interpolateRdYlGn);

const withOpacity = (rgb, a) => {
  return a !== undefined ? rgb.replace(")", `, ${a})`) : rgb;
}

const getScaledColor = (val, domain) => {
  const scale = colorScale.domain(domain);
  return withOpacity(scale(val), 0.4);
};

export {
  getScaledColor
};
