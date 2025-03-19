export const css = {
    getVar: (propName: string, element = document.documentElement) => getComputedStyle(element).getPropertyValue(propName),
    setVar: (propName: string, value: string, element = document.documentElement) => element.style.setProperty(propName, value),
}
