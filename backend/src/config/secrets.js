        if (!value.trim()) throw new Error(`${name}_FILE is empty`);
        env[name] = value;
    }
}

module.exports = { loadSecrets };
