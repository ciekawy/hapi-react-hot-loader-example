import * as path from 'path';
import * as fse from 'fs-extra';
import * as React from 'react';
import * as Hapi from 'hapi';
import {renderToString} from 'react-dom/server';
import RouterWrapper from '../../RouterWrapper';
import ProviderService from '../../services/ProviderService';
import rootSaga from '../../stores/rootSaga';
import ISagaStore from '../../interfaces/store/ISagaStore';
import IStore from '../../interfaces/store/IStore';
import IController from '../../interfaces/server/IController';

class ReactController implements IController {

    private _html: string = null;

    public mapRoutes(server: Hapi.Server): void {
        server.route({
            method: 'GET',
            path: '/{route*}',
            handler: async (request: Hapi.Request, reply: Hapi.ReplyNoContinue): Promise<void> => {
                const store: ISagaStore<IStore> = ProviderService.createProviderStore({}, true);
                const context: any = {};
                const app = (
                    <RouterWrapper
                        store={store}
                        location={request.path}
                        context={context}
                        isServerSide={true}
                    />
                );

                this._html = (this._html === null) ? await this._loadHtmlFile() : this._html;

                store.runSaga(rootSaga).done.then(() => {
                    if (context.url) {
                        return reply().redirect(context.url);
                    }

                    const renderedHtml: string = renderToString(app);
                    const state: IStore = store.getState();

                    const initialState: IStore = {
                        ...state,
                        renderReducer: {
                            isServerSide: true,
                        },
                    };

                    const html: string = this._html
                        .slice(0)
                        .replace('{title}', initialState.metaReducer.title)
                        .replace('{description}', initialState.metaReducer.description)
                        .replace('{content}', renderedHtml)
                        .replace('{state}', JSON.stringify(initialState));

                    return reply(html);
                }).catch((error: Error) => {
                    reply(error.toString());
                });

                renderToString(app);

                store.endSaga();
            },
        });
    }

    private async _loadHtmlFile(): Promise<string> {
        const htmlPath = path.resolve(__dirname, '../../public/index.html');

        return fse.readFile(htmlPath, 'utf8');
    }

}

export default ReactController;