const redis = require('redis');

// Create a Redis client
let redisClient = redis.createClient({
  host: '127.0.0.1',  // or the IP address of your Redis server
  port: 6379,         // default Redis port
  password: 'NeoAura@123',
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('Error connecting to Redis', err);
});

// Connect to Redis
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Function to reconnect to Redis if the connection is closed
function ensureConnected(callback) {
  if (!redisClient.connected) {
    redisClient = redis.createClient({
      host: '127.0.0.1',
      port: 6379,
      password: 'NeoAura@123',
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      console.log('Reconnected to Redis');
      callback();
    });

    redisClient.on('error', (err) => {
      console.error('Error reconnecting to Redis', err);
    });
  } else {
    callback();
  }
}

// Export the set function
const set = (key, value, callback) => {
  ensureConnected(() => {
    console.log(`Setting key: ${key}, value: ${value}`);
    redisClient.set(key, value, (err, reply) => {
      if (err) {
        console.error('Error in set function:', err);
        callback(err, null);
      } else {
        console.log('Set reply:', reply);
        callback(null, reply);
      }
    });
  });
};

// Export the get function
const get = (key, callback) => {
  ensureConnected(() => {
    console.log(`Getting key: ${key}`);
    redisClient.get(key, (err, reply) => {
      if (err) {
        console.error('Error in get function:', err);
        callback(err, null);
      } else {
        console.log('Get reply:', reply);
        callback(null, reply);
      }
    });
  });
};

module.exports = {
  set,
  get,
  redisClient
};
