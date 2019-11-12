import { Subscription } from '@unimodules/core';
import mediaQuery from 'css-mediaquery';
import ScreenOrientation from 'expo/build/ScreenOrientation/ScreenOrientation';
import { Dimensions } from 'react-native';

type Listener = (context: MediaQuery) => any;

class MediaQuery {

    private listeners: Listener[] = [];

    private orientation: ScreenOrientation.Orientation = ScreenOrientation.Orientation.PORTRAIT;

    private unsubscribe: Subscription;

    constructor(private query: string) {

        // @ts-ignore
        (async () => {
            const { orientation } = await ScreenOrientation.getOrientationAsync();
            this.updateListeners({ orientation })
        })()

        this.unsubscribe = ScreenOrientation.addOrientationChangeListener(({ orientationInfo: { orientation } }) => {
            this.updateListeners({ orientation })
        });

        Dimensions.addEventListener('change', this.resize);
    }

    private resize = () => {
        this.updateListeners({ orientation: this.orientation })
    }

    _unmount() {
        if (this.unsubscribe) this.unsubscribe.remove()
        Dimensions.removeEventListener('change', this.resize);
    }

    public addListener(listener: Listener) {
        this.listeners.push(listener)
    }

    public removeListener(listener: Listener) {
        const index = this.listeners.indexOf(listener)
        if (index !== -1)
            this.listeners.splice(index)
    }

    // @ts-ignore
    public get matches(): boolean {
        return mediaQuery.match(this.query, {
            type: 'screen',
            orientation: this.orientation.toLowerCase(),
            ...Dimensions.get('window'),
        })
    }

    private updateListeners({ orientation }) {
        this.orientation = orientation
        this.listeners.forEach(listener => {
            listener(this)
        })
    }
}

// guard against SSR
if (window) {
    // @ts-ignore
    window.matchMedia = mediaQueryString => new MediaQuery(mediaQueryString);
}