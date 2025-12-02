Jest automatically mocks global modules places in this folder. In order to unmock them - either use `jest.unmock('module_name')` or require actual.

It's places inside of `src` folder and not adjacent to `node_modules` because of how project roots configured.
