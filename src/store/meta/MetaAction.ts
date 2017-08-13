import IMetaReducerState from '../../interfaces/reducers/IMetaReducerState';
import IAction from '../../interfaces/IAction';

class MetaAction {

    public static readonly SET_META: string = 'MetaAction.SET_META';

    public static setMeta(meta: IMetaReducerState): IAction<IMetaReducerState>  {
        if (global.document) {
            global.document.title = meta.title;
        }

        return {
            type: MetaAction.SET_META,
            payload: meta,
        };
    }

}

export default MetaAction;
