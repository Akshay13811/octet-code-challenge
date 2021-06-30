import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { navigate } from '@reach/router';
import { act } from 'react-dom/test-utils';

window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};

const server = setupServer(
  rest.get('http://127.0.0.1:8080/rates', (req, res, ctx) => {
    return res(ctx.json({
      rates:[
        {
          _id:"AUDUSD",
          rate:0.714321,
          lastUpdated:"2021-06-30T14:00:01.864Z"
        },{
          _id:"AUDNZD",
          rate:1.038419359,
          lastUpdated:"2021-06-30T14:00:01.864Z"
        },{
          _id:"AUDINR",
          rate:55.74984219,
          lastUpdated:"2021-06-30T14:00:01.864Z"
        }]}))
  }),
  rest.get('http://127.0.0.1:8080/markup', (req, res, ctx) => {
    return res(ctx.json({"_id":"markup","value":5.24}));
  })
);

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('renders converted currency', async () => {
  const { getByText } = render(<App />);

  await waitFor(() => {
    const ratesLastUpdated = getByText("0.714321 US Dollar");
    expect(ratesLastUpdated).toBeInTheDocument();
  });
});

test('renders last updated', async () => {
  render(<App />);

  await waitFor(() => {
    const ratesLastUpdated = screen.getByText(/Rates last updated:/i);
    expect(ratesLastUpdated).toBeInTheDocument();
  });
});

test('renders target currencies in dropdown', async () => {
  const { getByText, getByTestId } = render(<App />);

  const elt = getByTestId('target-currency-select').firstElementChild;
  fireEvent.mouseDown(elt!);

  await waitFor(() => {
    expect(getByText('USD')).toBeInTheDocument()
    expect(getByText('NZD')).toBeInTheDocument()
    expect(getByText('INR')).toBeInTheDocument()
  });
});

test('select target currency in dropdown', async () => {
  const { getByText, findByText, getByTestId } = render(<App />);

  const select = getByTestId('target-currency-select').firstElementChild;
  fireEvent.mouseDown(select!);

  await findByText('NZD - New Zealand Dollar').then((elem) => {
    fireEvent.click(elem);
  });

  await expect(getByText('1.03842 New Zealand Dollar')).toBeVisible()
});

test('navigate to settings', async () => {
  const { getByText } = render(<App />);
  await act(async () => {
    await navigate('/settings')
  })
  expect(getByText('Markup Percentage')).toBeVisible();
});