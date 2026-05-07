import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 5,
    duration: '10s',
};

export default function () {
    const url = __ENV.BASE_URL || 'http://infection_app:8082';
    http.get(url);
    sleep(1);
}
