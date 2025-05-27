/**
 * Attaches time-constrained visibility to a display container.
 * The container fades in when progress is within [minProgress, maxProgress],
 * and fades out outside that range, with a smooth fade window.
 *
 * @param {PIXI.Container} container       - The display container to control.
 * @param {number} minProgress            - Start of visible range (0.0 to 1.0).
 * @param {number} maxProgress            - End of visible range (0.0 to 1.0).
 * @param {() => number} getProgress      - Function returning current progress (0.0 to 1.0).
 * @param {PIXI.Application} app          - PixiJS application for ticker access.
 * @param {number} [fadeFraction=0.1]     - Fraction of range used for fading edges.
 * @param {number} [onAlpha=1]             - Alpha value when visible.
 * @param {number} [offAlpha=0]            - Alpha value when hidden.
 */
export function makeTimeConstrained(
	component,
	minProgress,
	maxProgress,
	getProgress,
	app,
	fade_time = 0.1,
	onAlpha = 1,
	offAlpha = 0
) {

	const container = component.container;

	// Initialize alpha to 0
	container.alpha = 0;
	let elapsed_time = 0;
	const fade_time_ms = fade_time * 1000; // Convert to milliseconds

	app.ticker.add((delta) => {
		const now = getProgress();
		let targetAlpha = 0;

		if (now < minProgress || now > maxProgress) {
			targetAlpha = offAlpha;
		} else {
			targetAlpha = onAlpha;
		}

		// Smooth fade based on real elapsed time
		const deltaMS = app.ticker.deltaMS;
		const mix = Math.min(deltaMS / fade_time_ms, 1);
		container.alpha += (targetAlpha - container.alpha) * mix;
	});
}