/**
 * EventEmitter class
 * Simple implementation of the observer pattern for event handling
 */
export class EventEmitter {
    /**
     * Create a new EventEmitter instance
     */
    constructor() {
        this.events = {};
    }
    
    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener callback
     * @returns {EventEmitter} - Reference to this for chaining
     */
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push(listener);
        return this;
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener to remove
     * @returns {EventEmitter} - Reference to this for chaining
     */
    off(event, listener) {
        if (!this.events[event]) {
            return this;
        }
        
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
    }
    
    /**
     * Emit event with data
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     * @returns {boolean} - Whether event had listeners
     */
    emit(event, data) {
        if (!this.events[event]) {
            return false;
        }
        
        this.events[event].forEach(listener => {
            listener(data);
        });
        
        return true;
    }
    
    /**
     * Add one-time event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener callback
     * @returns {EventEmitter} - Reference to this for chaining
     */
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        
        return this.on(event, onceWrapper);
    }

    /**
     * Clear all listeners for a specific event or all events
     * @param {string} [event] - Event name to clear listeners for, or all events if not specified
     */
    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
} 