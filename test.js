import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 5,
    duration: '10s',
};

export default function () {
    http.get('http://host.docker.internal:9090');
    sleep(1);
}