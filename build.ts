import 'dotenv/config'
import axios from 'axios'
import figmaRestApi from './api/'
import {camelCaseToDash, createFolder, findAllByValue, iOSformat, removeFolder, writeToFile,} from './utils'


const OUTPUT_FOLDER = "./build/";
const RATE_LIMIT = 20;
const WAIT_TIME_IN_SECONDS = 1;
const getProjectNode = async (node: string) => {
    return await figmaRestApi.get(
        'files/' +
        process.env.FIGMA_PROJECT_ID +
        '/nodes?ids=' +
        node
    )
}

const getSVGURL = async (id: string) => {
    return await figmaRestApi.get(
        'images/' + process.env.FIGMA_PROJECT_ID + '/?ids=' + id + '&format=svg'
    )
}

const svgExporter = async () => {
    try {
        let svgs = [];
        removeFolder('build');

        [process.env.FIGMA_ICONS_NODE_ID, process.env.FIGMA_ILLUSTRATIONS_NODE_ID].map(async (nodeID) => {
            const folderName = nodeID === process.env.FIGMA_ICONS_NODE_ID ? 'icons' : 'illustrations'
            const folderPath = OUTPUT_FOLDER + 'svg/' + folderName

            createFolder(folderPath)

            const response = await getProjectNode(nodeID)

            const children = await response.data.nodes[nodeID].document.children

            svgs = findAllByValue(children, 'COMPONENT')

            const numOfSvgs = svgs.length

            for (let i = 0; i < numOfSvgs; i += RATE_LIMIT) {
                const requests = svgs.slice(i, i + RATE_LIMIT).map(async (svg) => {
                    let svgName = await svg.name

                    if (svgName.includes('/')) {
                        svgName = svg.name.split('/')[1]
                    }
                    const svgURL = await getSVGURL(svg.id)
                    const svgDOM = await axios.get(svgURL.data.images[svg.id])

                    writeToFile(
                        folderPath + '/' + `${camelCaseToDash(svgName)}.svg`,
                        svgDOM.data
                    )
                })

                /*
                * Wait for all requests to be processed before continuing
                * Figma API has a rate limit of 20 requests per second
                 */
                await Promise.all(requests)
                    .then(() => {
                        return new Promise<void>(function (resolve) {
                            setTimeout(() => {
                                resolve()
                            }, WAIT_TIME_IN_SECONDS * 1000)
                        })
                    })
                    .catch((err) => console.error(`Error proccessing ${i} - Error ${err}`))
            }
        })

    } catch (err) {
        console.error(err)
    }
}
svgExporter();
iOSformat(OUTPUT_FOLDER + 'svg/', ['icons', 'illustrations'], './build/ios');

