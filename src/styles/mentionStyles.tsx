const mentionStyle = {
  control: {
    backgroundColor: '#fff',
    fontSize: '14px',
    fontWeight: 'normal',
    minHeight: '40px',
  },
  highlighter: {
    overflow: 'hidden',
    padding: '9px',
  },
  input: {
    margin: 0,
    padding: '9px',
    overflow: 'auto',
    minHeight: '40px',
  },
  '&singleLine': {
    control: {
      display: 'inline-block',
      width: '100%',
    },
    highlighter: {
      padding: '9px',
      border: '1px solid transparent',
    },
    input: {
      padding: '9px',
      border: '1px solid silver',
    },
  },
  '&multiLine': {
    control: {
      fontFamily: 'inherit',
    },
    highlighter: {
      padding: '9px',
      border: '1px solid transparent',
    },
    input: {
      padding: '9px',
      border: '1px solid silver',
      minHeight: '40px',
      outline: 0,
    },
  },
  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.15)',
      fontSize: '14px',
      maxHeight: '150px',
      overflow: 'auto',
      position: 'absolute' as const,
      bottom: '100%',
      width: '100%',
      zIndex: 10,
    },
    item: {
      padding: '5px 15px',
      borderBottom: '1px solid rgba(0,0,0,0.15)',
      '&focused': {
        backgroundColor: '#cee4e5',
      },
    },
  },
};

export default mentionStyle;