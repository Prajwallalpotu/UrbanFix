import { render, screen, fireEvent } from '@testing-library/react';
import Upload from '../pages/Upload';
import axios from 'axios';

jest.mock('axios');

test('renders upload form', () => {
    render(<Upload />);
    expect(screen.getByText(/Pothole Detection/i)).toBeInTheDocument();
});

test('shows error on no file selected', () => {
    render(<Upload />);
    fireEvent.click(screen.getByText(/Detect Potholes/i));
    expect(screen.getByText(/Please choose an image file to upload./i)).toBeInTheDocument();
});

test('detects potholes successfully', async () => {
    axios.post.mockResolvedValue({ data: { potholesDetected: true, imageUrl: 'test_image_url' } });
    render(<Upload />);
    const fileInput = screen.getByLabelText(/Upload Image/i);
    fireEvent.change(fileInput, { target: { files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })] } });
    fireEvent.click(screen.getByText(/Detect Potholes/i));
    expect(await screen.findByText(/Potholes detected!/i)).toBeInTheDocument();
});
