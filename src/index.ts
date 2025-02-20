import joplin from 'api';
import {
  MenuItemLocation,
  ToolbarButtonLocation,
  SettingItemType,
} from 'api/types';
 function myrandom(seed :number){return parseFloat('0.'+Math.sin(seed).toString().substr(6));}

joplin.plugins.register({
  onStart: async function () {
    //Registering  Section
    await joplin.settings.registerSection('openRandomNoteSection', {
      label: 'Random Note',
      iconName: 'fas fa-random',
    });

    // Settings
    await joplin.settings.registerSetting('showToolBarIcon', {
      value: true,
      type: SettingItemType.Bool,
      section: 'openRandomNoteSection',
      label: 'Show Tool Bar Button',
      public: true,
      description: 'Alternative to using Hotkeys to open random notes',
    });

    await joplin.settings.registerSetting('useCustomHotkey', {
      value: false,
      type: SettingItemType.Bool,
      section: 'openRandomNoteSection',
      label: 'Use Custom Hotkey',
      public: true,
      description: 'Enter custom hotkey after selecting this option',
    });

    await joplin.settings.registerSetting('customHotkey', {
      value: 'Ctrl+Alt+R',
      type: SettingItemType.String,
      section: 'openRandomNoteSection',
      public: true,
      description: 'Separate your keys with a +',
      label: 'Enter Custom Hotkey',
    });

    // Commands
    await joplin.commands.register({
      name: 'openRandomNote',
      label: 'Open a random note',
      iconName: 'fas fa-random',
      execute: async () => {
        // get all notes
        const notes = await joplin.data.get(['notes'], { field: ['id'] });
        // If notes exist in vault
        if (notes.items) {
          // get current note
          const currentNote = await joplin.workspace.selectedNote();

          // excludes currently selected note
          const filteredNotes = notes.items.filter((note) => {
            if (currentNote.id != note.id) {
              return note;
            }
          });

          // calculating a random note id
          
          const randomNoteId = Math.floor(myrandom(new Date().getTime()) * filteredNotes.length);

          await joplin.commands.execute(
            'openNote',
            filteredNotes[randomNoteId].id
          );
        }
      },
    });

    // Get Settings Options
    let useCustomHotKey = await joplin.settings.value('useCustomHotkey');

    const customHotKey = await joplin.settings.value('customHotkey');
    const toolBarDecision = await joplin.settings.value('showToolBarIcon');

    const defualtAccelerator = 'Ctrl+Alt+R';

    // validating custom hotkey

    function validate(customHotKey) {
      if (customHotKey != '' || customHotKey != ' ') {
        // Regex to get all whitespace
        const regex = /\s+/g;
        let validatedHotKeys;
        const cleanWhiteSpace = customHotKey.replace(regex, '');
        const spaceCustom = cleanWhiteSpace.replace(/\+/g, ' ');

        const keySplit = spaceCustom.split(' ');

        const wordValidate = keySplit.map((word) => {
          return (word = word[0].toUpperCase() + word.substr(1));
        });

        validatedHotKeys = wordValidate.join('+');
        return validatedHotKeys;
      }
    }

    let key;

    if (useCustomHotKey === false) {
      key = defualtAccelerator;
    } else {
      if (customHotKey.length > 0) {
        key = validate(customHotKey);
      } else {
        await joplin.settings.setValue('customHotkey', defualtAccelerator);
        key = defualtAccelerator;
      }
    }

    await joplin.views.menuItems.create(
      'openRandomNoteMenu',
      'openRandomNote',
      MenuItemLocation.EditorContextMenu,
      { accelerator: key }
    );

    await joplin.views.menus.create('myMenu', 'Open Random Note', [
      {
        commandName: 'openRandomNote',
        accelerator: key,
      },
    ]);

    if (toolBarDecision) {
      await joplin.views.toolbarButtons.create(
        'openRandomNoteMenuViaToolbar',
        'openRandomNote',
        ToolbarButtonLocation.EditorToolbar
      );
    }
  },
});
