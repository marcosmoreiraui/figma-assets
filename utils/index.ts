import * as fs from 'fs'
import path from "path";

export const writeToFile = async (
    filename: string,
    data: string | NodeJS.ArrayBufferView
) => {
    return fs.writeFile(filename, data, (error) => {
        if (error) throw error
        console.log(`The file ${filename} has been saved!`)
    })
}

export const camelCaseToDash = (string: string) => {
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export const flattenArray = (arr: any[], d: number = 1) => {
    return d > 0
        ? arr.reduce(
            (acc, val) =>
                acc.concat(Array.isArray(val) ? flattenArray(val, d - 1) : val),
            []
        )
        : arr.slice()
}

export const findAllByValue = (
    obj: { id: string, name: string },
    valueToFind: string
) => {
    return Object.entries(obj).reduce(
        (acc, [key, value]) =>
            value === valueToFind
                ? acc.concat({
                    id: Object.values(obj.id).join(''),
                    name: Object.values(obj.name).join(''),
                })
                : typeof value === 'object' && value !== null
                    ? acc.concat(findAllByValue(value, valueToFind))
                    : acc,
        []
    )
}

export const createFolder = async (path: string) => {
    try {
        fs.mkdirSync(path, {recursive: true});
    } catch (err) {
        console.error(err);
    }
}

export const removeFolder = async (path: string) => {
    try {
        fs.rmSync(path, {recursive: true, force: true});
    } catch (err) {
        console.error(err);
    }
}

function toCamelCase(str) {
    return str
        .replace(/^\w|[A-Z]|\b\w/g, function (word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '')
        .replaceAll('-', '');
}

function getKey(str) {
    const reservedKeywords = ['repeat'];

    if (reservedKeywords.includes(str)) {
        return `\`${str}\``;
    } else {
        return str;
    }
}

const getLabel = (type) => {
    switch (type) {
        case 'icons':
            return 'Icon';
        case 'illustrations':
            return 'Illustration';
        case 'brands':
            return 'Brand';
        case 'cards':
            return 'Card';
        default:
            return '';
    }
};

export async function iOSformat(
    assetsUrl = './build/svg',
    types = ['icons', 'illustrations'],
    outputIcons = './build/ios'
) {
    const extension = '.svg';

    createFolder(outputIcons);

    types.forEach((type) => {
        let icons = [];

        const files = fs.readdirSync(path.resolve(`${assetsUrl}/${type}`));

        for (const file of files) {
            const name = `${file.replace(extension, '')}`;
            const key = getKey(toCamelCase(name));
            const item = `case ${key} = "${name}" \n`;
            icons.push(item);
        }

        const group = `
public protocol ${getLabel(type)} { 
  var id: String { get } 
}

public enum ${getLabel(
            type
        )}s: String, ${getLabel(type)} { 
    ${icons.join('')}
  public var id: String {
      return self.rawValue
  }
}
  `;
        fs.writeFileSync(
            `${outputIcons}/${getLabel(
                type
            )}s.swift`,
            group
        );
    });
}

export const filterPrivateComponents = (svgs: any[]) =>
    svgs.filter(({name}) => !name.startsWith('.') && !name.startsWith('_'))

exports.writeToFile = writeToFile
exports.camelCaseToDash = camelCaseToDash
exports.flattenArray = flattenArray
exports.findAllByValue = findAllByValue
exports.createFolder = createFolder
exports.filterPrivateComponents = filterPrivateComponents
exports.removeFolder = removeFolder
exports.iOSformat = iOSformat
