const EventEmitter = require('events');

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

// Singleton
const eventBus = new AppEventBus();

module.exports = eventBus;
